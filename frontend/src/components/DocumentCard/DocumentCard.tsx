import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Document } from '../../types/document.types';
import { DocumentStatus } from '../../types/document.types';
import { StatusBadge, TypeBadge } from '../StatusBadge/StatusBadge';
import { useDeleteDocument, useReprocessDocument } from '../../hooks/useUploadDocument';

interface DocumentCardProps {
  document: Document;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentCard({ document }: DocumentCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();
  const { mutate: reprocess, isPending: isReprocessing } = useReprocessDocument();
  const isProcessing = document.status === DocumentStatus.PROCESSING ||
    document.status === DocumentStatus.PENDING;

  function handleDelete() {
    deleteDoc(document.id, { onSuccess: () => setShowConfirm(false) });
  }

  return (
    <>
      <div className={`doc-card${isProcessing ? ' doc-card--processing' : ''}`}>
        <div className="doc-card__header">
          <div className="doc-card__title-row">
            <h3 className="doc-card__title">{document.originalName}</h3>
            <div className="doc-card__badges">
              <TypeBadge type={document.documentType} />
              <StatusBadge status={document.status} />
            </div>
          </div>
          <div className="doc-card__meta">
            <span>{formatBytes(document.fileSize)}</span>
            <span>·</span>
            <span>{formatDate(document.createdAt)}</span>
            {document.confidenceScore !== null && (
              <>
                <span>·</span>
                <span>
                  {Math.round(document.confidenceScore * 100)}% confidence
                </span>
              </>
            )}
          </div>
        </div>

        {document.status === DocumentStatus.FAILED && document.errorMessage && (
          <p className="doc-card__error">{document.errorMessage}</p>
        )}

        {isProcessing && (
          <div className="doc-card__progress">
            <div className="progress-bar">
              <div className="progress-bar__fill progress-bar__fill--animated" />
            </div>
            <p className="doc-card__progress-text">AI is processing your document…</p>
          </div>
        )}

        <div className="doc-card__actions">
          {document.status === DocumentStatus.COMPLETED && (
            <button
              className="btn btn--primary btn--sm"
              onClick={() => navigate(`/documents/${document.id}`)}
            >
              View results
            </button>
          )}
          {document.status === DocumentStatus.FAILED && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => reprocess(document.id)}
              disabled={isReprocessing}
            >
              {isReprocessing ? 'Reprocessing…' : 'Retry'}
            </button>
          )}
          <button
            className="btn btn--danger btn--sm"
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting || isProcessing}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="dialog-overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2 className="dialog__title">Delete document</h2>
            <p className="dialog__message">
              Are you sure you want to delete "{document.originalName}"? This
              cannot be undone.
            </p>
            <div className="dialog__actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
