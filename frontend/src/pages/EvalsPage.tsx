import { useState, useEffect } from 'react';
import { evalsApi, type EvalSummary, type ProviderStats } from '../api/evals.api';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'var(--color-success-text)';
  if (pct >= 50) return 'var(--color-warning)';
  return 'var(--color-danger-text)';
}

export function EvalsPage() {
  const [summary, setSummary] = useState<EvalSummary | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setIsLoadingStats(true);
    try {
      const data = await evalsApi.getProviderStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoadingStats(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  async function handleRunEvals() {
    setIsRunning(true);
    setError(null);
    try {
      const result = await evalsApi.run();
      setSummary(result);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation run failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Evals & LLMOps</div>
          <div className="page-header__sub">Accuracy testing and AI provider observability</div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary btn--sm" onClick={handleRunEvals} disabled={isRunning}>
            {isRunning ? (
              <><div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff' }} /> Running…</>
            ) : (
              <><i className="ti ti-player-play" aria-hidden="true" style={{ fontSize: '14px' }} /> Run evaluation suite</>
            )}
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label"><i className="ti ti-api" aria-hidden="true" />Total AI calls</div>
            <div className="stat-card__value">{isLoadingStats ? '—' : stats?.totalCalls ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label"><i className="ti ti-circle-check" aria-hidden="true" style={{ color: 'var(--color-success)' }} />Call success rate</div>
            <div className="stat-card__value" style={{ color: 'var(--color-success-text)' }}>
              {isLoadingStats ? '—' : `${stats?.successRate ?? 0}%`}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label"><i className="ti ti-clock" aria-hidden="true" />Avg latency</div>
            <div className="stat-card__value">{isLoadingStats ? '—' : `${stats?.avgLatencyMs ?? 0}ms`}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label"><i className="ti ti-currency-dollar" aria-hidden="true" />Est. cost (paid tier)</div>
            <div className="stat-card__value">
              {isLoadingStats ? '—' : `$${(stats?.totalEstimatedCostUsd ?? 0).toFixed(4)}`}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div className="section-header">
            <div className="section-title">Provider breakdown</div>
          </div>
          {isLoadingStats ? (
            <div className="loading"><div className="spinner" />Loading provider stats…</div>
          ) : !stats || stats.byProvider.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="ti ti-route" aria-hidden="true" /></div>
              <div className="empty-state__title">No AI calls logged yet</div>
              <div className="empty-state__text">Upload a document or run the evaluation suite to see provider performance.</div>
            </div>
          ) : (
            <div className="doc-table">
              <div className="doc-table__head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div className="doc-table__th">Provider</div>
                <div className="doc-table__th">Calls</div>
                <div className="doc-table__th">Success rate</div>
                <div className="doc-table__th">Avg latency</div>
              </div>
              {stats.byProvider.map(p => (
                <div key={p.provider} className="doc-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', cursor: 'default' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.provider}</div>
                  <div style={{ fontSize: '13px' }}>{p.calls}</div>
                  <div style={{ fontSize: '13px', color: p.successRate >= 80 ? 'var(--color-success-text)' : 'var(--color-warning)' }}>
                    {p.successRate}%
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{p.avgLatencyMs}ms</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="section-header">
            <div className="section-title">Extraction accuracy</div>
          </div>

          {!summary ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="ti ti-target-arrow" aria-hidden="true" /></div>
              <div className="empty-state__title">No evaluation run yet</div>
              <div className="empty-state__text">Click "Run evaluation suite" to test extraction accuracy against known sample documents.</div>
            </div>
          ) : (
            <>
              <div className="stat-card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-card__label">Overall accuracy</div>
                  <div className="stat-card__value" style={{ color: accuracyColor(summary.overallAccuracy) }}>
                    {summary.overallAccuracy}%
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Last run: {new Date(summary.timestamp).toLocaleString('en-GB')}
                </div>
              </div>

              {summary.results.map(result => (
                <div key={result.documentType} className="doc-table" style={{ marginBottom: '12px' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{result.documentType}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{result.provider}</span>
                    </div>
                    <span className="badge" style={{
                      background: accuracyColor(result.accuracyPercent) === 'var(--color-success-text)' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                      color: accuracyColor(result.accuracyPercent),
                    }}>
                      {result.accuracyPercent}% accurate
                    </span>
                  </div>
                  {result.fieldScores.map(f => (
                    <div key={f.field} className="extraction-row">
                      <div className="extraction-row__key">{f.field}</div>
                      <div className="extraction-row__value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i
                          className={`ti ${f.match ? 'ti-check' : 'ti-x'}`}
                          aria-hidden="true"
                          style={{ color: f.match ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontSize: '14px' }}
                        />
                        <span style={{ color: 'var(--color-text-muted)' }}>expected:</span> {String(f.expected)}
                        <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>got:</span> {String(f.actual ?? '—')}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}