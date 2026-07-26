import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../hooks/useDocuments';
import { ExtractionResult } from '../components/ExtractionResult/ExtractionResult';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';
import { DocumentStatus, DocumentType } from '../types/document.types';

function TypeBadge({ type }: { type: DocumentType }) {
  const map: Record<DocumentType, string> = {
    [DocumentType.INVOICE]: 'badge--invoice',
    [DocumentType.CONTRACT]: 'badge--contract',
    [DocumentType.REPORT]: 'badge--report',
    [DocumentType.BANK_STATEMENT]: 'badge--report',
    [DocumentType.EXPENSE_VOUCHER]: 'badge--invoice',
    [DocumentType.PAYROLL_RECORD]: 'badge--contract',
    [DocumentType.UNKNOWN]: 'badge--unknown',
  };
  const labels: Record<DocumentType, string> = {
    [DocumentType.INVOICE]: 'Invoice',
    [DocumentType.CONTRACT]: 'Contract',
    [DocumentType.REPORT]: 'Report',
    [DocumentType.BANK_STATEMENT]: 'Bank statement',
    [DocumentType.EXPENSE_VOUCHER]: 'Expense voucher',
    [DocumentType.PAYROLL_RECORD]: 'Payroll record',
    [DocumentType.UNKNOWN]: 'Unknown',
  };
  return <span className={`badge ${map[type]}`}>{labels[type]}</span>;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, { cls: string; label: string }> = {
    [DocumentStatus.COMPLETED]: { cls: 'badge--invoice', label: 'Completed' },
    [DocumentStatus.PROCESSING]: { cls: 'badge--report', label: 'Processing' },
    [DocumentStatus.PENDING]: { cls: 'badge--unknown', label: 'Pending' },
    [DocumentStatus.FAILED]: { cls: '', label: 'Failed' },
  };
  const { cls, label } = map[status];
  return <span className={`badge ${cls}`} style={status === DocumentStatus.FAILED ? { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' } : {}}>{label}</span>;
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, isLoading, isError, error } = useDocument(id ?? '');

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading document…
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="page-content">
        <ErrorBanner message={error?.message ?? 'Document not found'} />
        <button className="btn btn--secondary btn--sm" onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: '14px' }} /> Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="detail-header">
        <a className="detail-header__back" onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: '14px' }} />
          Documents
        </a>
        <span className="detail-header__divider">/</span>
        <span className="detail-header__name">{document.originalName}</span>
        <div className="detail-header__badges">
          <TypeBadge type={document.documentType} />
          <StatusBadge status={document.status} />
        </div>
      </div>

      <div className="page-content">
        {document.status === DocumentStatus.PROCESSING || document.status === DocumentStatus.PENDING ? (
          <div className="processing-state">
            <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
            <div className="processing-state__text">AI is extracting data from your document…</div>
          </div>
        ) : document.status === DocumentStatus.FAILED ? (
          <div className="failed-state">
            <ErrorBanner message={document.errorMessage ?? 'Processing failed'} />
          </div>
        ) : document.extractedData ? (
          <>
            {document.needsReview && (
              <div className="error-banner" style={{ background: 'var(--color-warning-bg)', borderColor: '#fde68a' }}>
                <span className="error-banner__message" style={{ color: 'var(--color-warning)' }}>
                  <i className="ti ti-alert-triangle" aria-hidden="true" style={{ marginRight: '6px' }} />
                  This extraction has lower AI confidence ({Math.round((document.confidenceScore ?? 0) * 100)}%). Please review the details below before relying on them.
                </span>
              </div>
            )}
            <ExtractionResult
              documentType={document.documentType}
              data={document.extractedData}
              documentName={document.originalName}
            />
          </>
        ) : null}
      </div>
    </>
  );
}