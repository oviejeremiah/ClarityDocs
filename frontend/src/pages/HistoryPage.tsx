import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentStatus } from '../types/document.types';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function eventFor(status: DocumentStatus): { icon: string; label: string; color: string } {
  switch (status) {
    case DocumentStatus.COMPLETED: return { icon: 'ti-circle-check', label: 'processed successfully', color: 'var(--color-success-text)' };
    case DocumentStatus.FAILED: return { icon: 'ti-x', label: 'processing failed', color: 'var(--color-danger-text)' };
    case DocumentStatus.PROCESSING: return { icon: 'ti-loader', label: 'is processing', color: 'var(--color-warning)' };
    default: return { icon: 'ti-clock', label: 'is pending', color: 'var(--color-text-muted)' };
  }
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { documents, isLoading } = useDocuments();

  const sorted = [...documents].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">History</div>
          <div className="page-header__sub">Activity log for all document processing events</div>
        </div>
      </div>

      <div className="page-content">
        {isLoading ? (
          <div className="loading"><div className="spinner" />Loading history…</div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><i className="ti ti-clock-history" aria-hidden="true" /></div>
            <div className="empty-state__title">No activity yet</div>
            <div className="empty-state__text">Upload a document to start building your history.</div>
          </div>
        ) : (
          <div className="doc-table">
            {sorted.map((doc) => {
              const event = eventFor(doc.status);
              return (
                <div
                  key={doc.id}
                  className="doc-row"
                  style={{ gridTemplateColumns: '32px 1fr 140px', cursor: doc.status === DocumentStatus.COMPLETED ? 'pointer' : 'default' }}
                  onClick={() => doc.status === DocumentStatus.COMPLETED && navigate(`/documents/${doc.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${event.icon}`} aria-hidden="true" style={{ fontSize: '16px', color: event.color }} />
                  </div>
                  <div>
                    <div className="doc-row__title">
                      <span style={{ fontWeight: 600 }}>{doc.originalName}</span> {event.label}
                    </div>
                    <div className="doc-row__meta">
                      Type: <span style={{ textTransform: 'capitalize' }}>{doc.documentType}</span>
                      {doc.confidenceScore !== null && ` · ${Math.round(doc.confidenceScore * 100)}% confidence`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatDate(doc.updatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}