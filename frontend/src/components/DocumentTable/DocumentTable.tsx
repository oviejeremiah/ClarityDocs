import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Document } from '../../types/document.types';
import { DocumentStatus, DocumentType } from '../../types/document.types';
import { useDeleteDocument, useReprocessDocument } from '../../hooks/useUploadDocument';

interface DocumentTableProps {
  documents: Document[];
}

function getIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return { cls: 'doc-row__icon--pdf', icon: 'ti-file-type-pdf' };
  if (mimeType?.includes('word') || mimeType?.includes('docx')) return { cls: 'doc-row__icon--docx', icon: 'ti-file-text' };
  if (mimeType === 'text/csv' || mimeType?.includes('excel')) return { cls: 'doc-row__icon--csv', icon: 'ti-table' };
  if (mimeType?.includes('sheet')) return { cls: 'doc-row__icon--xlsx', icon: 'ti-table' };
  if (mimeType?.startsWith('image/')) return { cls: 'doc-row__icon--image', icon: 'ti-photo' };
  return { cls: 'doc-row__icon--default', icon: 'ti-file' };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>;
  const pct = Math.round(score * 100);
  return (
    <div className="confidence-bar">
      <div className="confidence-bar__track">
        <div
          className={`confidence-bar__fill${pct < 70 ? ' confidence-bar__fill--low' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="confidence-bar__text">{pct}%</span>
    </div>
  );
}

function StatusCell({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, { cls: string; label: string }> = {
    [DocumentStatus.COMPLETED]: { cls: 'status--completed', label: 'Completed' },
    [DocumentStatus.PROCESSING]: { cls: 'status--processing', label: 'Processing' },
    [DocumentStatus.PENDING]: { cls: 'status--pending', label: 'Pending' },
    [DocumentStatus.FAILED]: { cls: 'status--failed', label: 'Failed' },
  };
  const { cls, label } = map[status];
  return (
    <div className={`status ${cls}`}>
      <span className="status__dot" />
      <span className="status__text">{label}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: DocumentType }) {
  const map: Record<DocumentType, string> = {
    [DocumentType.INVOICE]: 'badge--invoice',
    [DocumentType.CONTRACT]: 'badge--contract',
    [DocumentType.REPORT]: 'badge--report',
    [DocumentType.UNKNOWN]: 'badge--unknown',
  };
  return <span className={`badge ${map[type]}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>;
}

function ConfirmDialog({ name, onConfirm, onCancel, isDeleting }: {
  name: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog__title">Delete document</div>
        <div className="dialog__message">
          Are you sure you want to delete "{name}"? This action cannot be undone.
        </div>
        <div className="dialog__actions">
          <button className="btn btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentTable({ documents }: DocumentTableProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();
  const { mutate: reprocess } = useReprocessDocument();

  function handleDelete(id: string) {
    deleteDoc(id, { onSuccess: () => setDeletingId(null) });
  }

  const confirmDoc = deletingId ? documents.find(d => d.id === deletingId) : null;

  return (
    <>
      <div className="doc-table">
        <div className="doc-table__head">
          <div className="doc-table__th">Document</div>
          <div className="doc-table__th">Type</div>
          <div className="doc-table__th">Status</div>
          <div className="doc-table__th">Confidence</div>
          <div className="doc-table__th" style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {documents.map(doc => {
          const { cls, icon } = getIcon(doc.mimeType);
          const isProcessing = doc.status === DocumentStatus.PROCESSING || doc.status === DocumentStatus.PENDING;
          return (
            <div key={doc.id} className="doc-row" onClick={() => doc.status === DocumentStatus.COMPLETED && navigate(`/documents/${doc.id}`)}>
              <div className="doc-row__name">
                <div className={`doc-row__icon ${cls}`}>
                  <i className={`ti ${icon}`} aria-hidden="true" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="doc-row__title">{doc.originalName}</div>
                  <div className="doc-row__meta">{formatBytes(doc.fileSize)} · {formatDate(doc.createdAt)}</div>
                </div>
              </div>
              <div><TypeBadge type={doc.documentType} /></div>
              <div>
                {isProcessing ? (
                  <div>
                    <StatusCell status={doc.status} />
                    <div className="progress-bar" style={{ marginTop: '6px', maxWidth: '80px' }}>
                      <div className="progress-bar__fill" />
                    </div>
                  </div>
                ) : (
                  <StatusCell status={doc.status} />
                )}
              </div>
              <div>
                <ConfidenceBar score={isProcessing ? null : doc.confidenceScore} />
              </div>
              <div className="doc-row__actions" onClick={e => e.stopPropagation()}>
                {doc.status === DocumentStatus.COMPLETED && (
                  <button className="btn--icon" title="View results" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <i className="ti ti-eye" aria-hidden="true" />
                  </button>
                )}
                {doc.status === DocumentStatus.FAILED && (
                  <button className="btn--icon" title="Retry" onClick={() => reprocess(doc.id)}>
                    <i className="ti ti-refresh" aria-hidden="true" style={{ color: 'var(--color-warning)' }} />
                  </button>
                )}
                <button className="btn--icon" title="Delete" onClick={() => setDeletingId(doc.id)}>
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDoc && (
        <ConfirmDialog
          name={confirmDoc.originalName}
          onConfirm={() => handleDelete(confirmDoc.id)}
          onCancel={() => setDeletingId(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}