import { apiClient } from './client';

export interface FieldScore {
  field: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
}

export interface EvalResult {
  documentType: string;
  provider: string;
  fieldScores: FieldScore[];
  accuracyPercent: number;
}

export interface EvalSummary {
  overallAccuracy: number;
  results: EvalResult[];
  timestamp: string;
}

export interface ProviderStat {
  provider: string;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface ProviderStats {
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalEstimatedCostUsd: number;
  byProvider: ProviderStat[];
}

export const evalsApi = {
  run: async (): Promise<EvalSummary> => {
    const { data } = await apiClient.post<EvalSummary>('/api/evals/run');
    return data;
  },

  getProviderStats: async (): Promise<ProviderStats> => {
    const { data } = await apiClient.get<ProviderStats>('/api/provider-logs/stats');
    return data;
  },
};