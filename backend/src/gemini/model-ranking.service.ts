import { Injectable, Logger } from '@nestjs/common';
import {
  ProviderLogsService,
  RecentProviderStat,
} from '../provider-logs/provider-logs.service';

export interface ModelRankingEntry {
  model: string;
  score: number;
  calls: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  coolingDown: boolean;
}

@Injectable()
export class ModelRankingService {
  private readonly logger = new Logger(ModelRankingService.name);
  private readonly windowMinutes = 60;
  private readonly cacheTtlMs = 60_000;
  private readonly minCalls = 3;
  private readonly neutralScore = 0.6;
  private readonly cooldownStreak = 3;
  private readonly cooldownMs = 5 * 60_000;
  private cache: {
    loadedAt: number;
    stats: Map<string, RecentProviderStat>;
  } | null = null;
  private readonly lastOrder = new Map<string, string>();

  constructor(private readonly providerLogsService: ProviderLogsService) {}

  private async loadStats(): Promise<Map<string, RecentProviderStat>> {
    const now = Date.now();
    if (this.cache && now - this.cache.loadedAt < this.cacheTtlMs) {
      return this.cache.stats;
    }
    try {
      const stats = await this.providerLogsService.getRecentStats(
        this.windowMinutes,
      );
      const map = new Map(stats.map((s) => [s.provider, s]));
      this.cache = { loadedAt: now, stats: map };
      return map;
    } catch (error) {
      this.logger.warn(
        `Could not load provider stats, keeping configured order: ${String(error)}`,
      );
      return new Map<string, RecentProviderStat>();
    }
  }

  private scoreModel(
    stat: RecentProviderStat | undefined,
    now: number,
  ): { score: number; coolingDown: boolean } {
    if (!stat || stat.calls < this.minCalls) {
      return { score: this.neutralScore, coolingDown: false };
    }

    if (stat.recentFailureStreak >= this.cooldownStreak) {
      const withinCooldown =
        stat.lastFailureAt !== null &&
        now - stat.lastFailureAt.getTime() < this.cooldownMs;
      return withinCooldown
        ? { score: -1, coolingDown: true }
        : { score: this.neutralScore, coolingDown: false };
    }

    const speed =
      stat.avgSuccessLatencyMs === null
        ? 0
        : 1 / (1 + stat.avgSuccessLatencyMs / 5000);
    return { score: 0.7 * stat.successRate + 0.3 * speed, coolingDown: false };
  }

  async report(models: string[], prefix: string): Promise<ModelRankingEntry[]> {
    const stats = await this.loadStats();
    const now = Date.now();

    return models
      .map((model, index) => {
        const stat = stats.get(`${prefix}${model}`);
        const { score, coolingDown } = this.scoreModel(stat, now);
        return {
          index,
          entry: {
            model,
            score: Math.round(score * 1000) / 1000,
            calls: stat?.calls ?? 0,
            successRate: stat ? Math.round(stat.successRate * 100) : null,
            avgLatencyMs: stat?.avgSuccessLatencyMs ?? null,
            coolingDown,
          },
        };
      })
      .sort((a, b) => b.entry.score - a.entry.score || a.index - b.index)
      .map((x) => x.entry);
  }

  async rank(models: string[], prefix: string): Promise<string[]> {
    const entries = await this.report(models, prefix);
    const ordered = entries.map((e) => e.model);
    const orderKey = ordered.join(' > ');
    if (this.lastOrder.get(prefix) !== orderKey) {
      this.lastOrder.set(prefix, orderKey);
      this.logger.log(`Model order (${prefix}) is now: ${orderKey}`);
    }
    return ordered;
  }
}
