import { useDocuments } from '../hooks/useDocuments';
import { DocumentStatus, DocumentType } from '../types/document.types';

function countBy<T extends string>(items: T[]): Record<string, number> {
  return items.reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc; }, {} as Record<string, number>);
}

export function AnalyticsPage() {
  const { documents, isLoading } = useDocuments();

  const completed = documents.filter(d => d.status === DocumentStatus.COMPLETED);
  const failed = documents.filter(d => d.status === DocumentStatus.FAILED);
  const successRate = documents.length > 0 ? Math.round((completed.length / documents.length) * 100) : 0;
  const avgConfidence = completed.length > 0
    ? Math.round(completed.reduce((s, d) => s + (d.confidenceScore ?? 0), 0) / completed.length * 100)
    : 0;

  const typeCounts = countBy(documents.map(d => d.documentType));
  const typeOrder: DocumentType[] = [DocumentType.INVOICE, DocumentType.CONTRACT, DocumentType.REPORT, DocumentType.UNKNOWN];
  const maxTypeCount = Math.max(1, ...Object.values(typeCounts));

  const formatCounts = countBy(documents.map(d => {
    if (d.mimeType === 'application/pdf') return 'PDF';
    if (d.mimeType?.includes('word')) return 'DOCX';
    if (d.mimeType === 'text/csv') return 'CSV';
    if (d.mimeType?.includes('sheet')) return 'XLSX';
    if (d.mimeType?.startsWith('image/')) return 'Image';
    return 'Other';
  }));

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Analytics</div>
          <div className="page-header__sub">Processing performance across your documents</div>
        </div>
      </div>

      <div className="page-content">
        {isLoading ? (
          <div className="loading"><div className="spinner" />Loading analytics…</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><i className="ti ti-chart-bar" aria-hidden="true" /></div>
            <div className="empty-state__title">No data yet</div>
            <div className="empty-state__text">Upload documents to see processing analytics.</div>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card__label"><i className="ti ti-files" aria-hidden="true" />Total processed</div>
                <div className="stat-card__value">{documents.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label"><i className="ti ti-circle-check" aria-hidden="true" style={{ color: 'var(--color-success)' }} />Success rate</div>
                <div className="stat-card__value" style={{ color: 'var(--color-success-text)' }}>{successRate}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label"><i className="ti ti-x" aria-hidden="true" style={{ color: 'var(--color-danger)' }} />Failed</div>
                <div className="stat-card__value" style={{ color: 'var(--color-danger-text)' }}>{failed.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label"><i className="ti ti-star" aria-hidden="true" style={{ color: 'var(--color-primary-text)' }} />Avg confidence</div>
                <div className="stat-card__value" style={{ color: 'var(--color-primary-text)' }}>{avgConfidence}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="doc-table" style={{ padding: '20px' }}>
                <div className="section-title" style={{ marginBottom: '16px' }}>Documents by type</div>
                {typeOrder.map(type => {
                  const count = typeCounts[type] ?? 0;
                  const pct = Math.round((count / maxTypeCount) * 100);
                  return (
                    <div key={type} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{type}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{count}</span>
                      </div>
                      <div className="confidence-bar__track" style={{ maxWidth: 'none' }}>
                        <div className="confidence-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="doc-table" style={{ padding: '20px' }}>
                <div className="section-title" style={{ marginBottom: '16px' }}>Documents by format</div>
                {Object.entries(formatCounts).map(([format, count]) => {
                  const pct = Math.round((count / documents.length) * 100);
                  return (
                    <div key={format} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>{format}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="confidence-bar__track" style={{ maxWidth: 'none' }}>
                        <div className="confidence-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}