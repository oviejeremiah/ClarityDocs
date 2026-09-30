/// <reference types="jest" />
import { ModelRankingService } from './model-ranking.service';
import {
  ProviderLogsService,
  RecentProviderStat,
} from '../provider-logs/provider-logs.service';

function stat(
  model: string,
  overrides: Partial<RecentProviderStat>,
): RecentProviderStat {
  return {
    provider: `openrouter:${model}`,
    calls: 10,
    successRate: 1,
    avgSuccessLatencyMs: 2000,
    recentFailureStreak: 0,
    lastFailureAt: null,
    ...overrides,
  };
}

function build(stats: RecentProviderStat[]): ModelRankingService {
  const logs = {
    getRecentStats: jest.fn().mockResolvedValue(stats),
  } as unknown as ProviderLogsService;
  return new ModelRankingService(logs);
}

describe('ModelRankingService', () => {
  const models = ['a', 'b', 'c'];

  it('keeps configured order when there is no data', async () => {
    const service = build([]);
    expect(await service.rank(models, 'openrouter:')).toEqual(['a', 'b', 'c']);
  });

  it('puts the faster, reliable model first', async () => {
    const service = build([
      stat('a', { avgSuccessLatencyMs: 9000 }),
      stat('b', { avgSuccessLatencyMs: 1500 }),
    ]);
    const ordered = await service.rank(models, 'openrouter:');
    expect(ordered[0]).toBe('b');
  });

  it('moves a model that keeps failing to the end', async () => {
    const service = build([
      stat('a', {
        successRate: 0,
        avgSuccessLatencyMs: null,
        recentFailureStreak: 5,
        lastFailureAt: new Date(),
      }),
      stat('b', {}),
    ]);
    const ordered = await service.rank(models, 'openrouter:');
    expect(ordered[ordered.length - 1]).toBe('a');
  });
});
