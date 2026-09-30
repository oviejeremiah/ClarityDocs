import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ProviderLog } from './entities/provider-log.entity';

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'openrouter:google/gemma-4-31b-it:free': { input: 0, output: 0 },
  'openrouter:google/gemma-4-26b-a4b-it:free': { input: 0, output: 0 },
  'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free': { input: 0, output: 0 },
};

export interface LogEntryInput {
  documentId?: string | null;
  operation: string;
  provider: string;
  success: boolean;
  latencyMs: number;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  errorMessage?: string;
}
export interface RecentProviderStat {
  provider: string;
  calls: number;
  successRate: number;
  avgSuccessLatencyMs: number | null;
  recentFailureStreak: number;
  lastFailureAt: Date | null;
}

@Injectable()
export class ProviderLogsService {
  private readonly logger = new Logger(ProviderLogsService.name);

  constructor(
    @InjectRepository(ProviderLog)
    private readonly repository: Repository<ProviderLog>,
  ) {}

  private estimateCost(
    provider: string,
    inputTokens?: number,
    outputTokens?: number,
  ): number | null {
    const rates = COST_PER_1K_TOKENS[provider];
    if (!rates || inputTokens === undefined || outputTokens === undefined) {
      return null;
    }
    return (
      (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output
    );
  }

  async log(entry: LogEntryInput): Promise<void> {
    const estimatedCostUsd = this.estimateCost(
      entry.provider,
      entry.estimatedInputTokens,
      entry.estimatedOutputTokens,
    );

    const record = this.repository.create({
      documentId: entry.documentId ?? null,
      operation: entry.operation,
      provider: entry.provider,
      success: entry.success,
      latencyMs: entry.latencyMs,
      estimatedInputTokens: entry.estimatedInputTokens ?? null,
      estimatedOutputTokens: entry.estimatedOutputTokens ?? null,
      estimatedCostUsd,
      errorMessage: entry.errorMessage ?? null,
    });

    await this.repository.save(record);
  }

  async getRecentStats(windowMinutes = 60): Promise<RecentProviderStat[]> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const logs = await this.repository.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
      take: 2000,
    });

    const groups = new Map<string, ProviderLog[]>();
    for (const log of logs) {
      const group = groups.get(log.provider) ?? [];
      group.push(log);
      groups.set(log.provider, group);
    }

    return Array.from(groups.entries()).map(([provider, group]) => {
      const successes = group.filter((l) => l.success);
      let streak = 0;
      for (const l of group) {
        if (l.success) break;
        streak++;
      }
      const lastFailure = group.find((l) => !l.success) ?? null;
      return {
        provider,
        calls: group.length,
        successRate: successes.length / group.length,
        avgSuccessLatencyMs:
          successes.length > 0
            ? Math.round(
                successes.reduce((sum, l) => sum + l.latencyMs, 0) /
                  successes.length,
              )
            : null,
        recentFailureStreak: streak,
        lastFailureAt: lastFailure ? lastFailure.createdAt : null,
      };
    });
  }

  async getStats(): Promise<{
    totalCalls: number;
    successRate: number;
    avgLatencyMs: number;
    totalEstimatedCostUsd: number;
    byProvider: Array<{
      provider: string;
      calls: number;
      successRate: number;
      avgLatencyMs: number;
    }>;
  }> {
    const logs = await this.repository.find();

    if (logs.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        avgLatencyMs: 0,
        totalEstimatedCostUsd: 0,
        byProvider: [],
      };
    }

    const totalCalls = logs.length;
    const successCount = logs.filter((l) => l.success).length;
    const successRate = Math.round((successCount / totalCalls) * 100);
    const avgLatencyMs = Math.round(
      logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalCalls,
    );
    const totalEstimatedCostUsd = logs.reduce(
      (sum, l) => sum + (l.estimatedCostUsd ?? 0),
      0,
    );

    const providerGroups = new Map<string, ProviderLog[]>();
    for (const log of logs) {
      const group = providerGroups.get(log.provider) ?? [];
      group.push(log);
      providerGroups.set(log.provider, group);
    }

    const byProvider = Array.from(providerGroups.entries()).map(
      ([provider, group]) => ({
        provider,
        calls: group.length,
        successRate: Math.round(
          (group.filter((l) => l.success).length / group.length) * 100,
        ),
        avgLatencyMs: Math.round(
          group.reduce((sum, l) => sum + l.latencyMs, 0) / group.length,
        ),
      }),
    );

    return {
      totalCalls,
      successRate,
      avgLatencyMs,
      totalEstimatedCostUsd,
      byProvider,
    };
  }
}
