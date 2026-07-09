import { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { UploadZone } from '../components/UploadZone/UploadZone';
import { DocumentTable } from '../components/DocumentTable/DocumentTable';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';
import { DocumentStatus, DocumentType } from '../types/document.types';

type Filter = 'all' | DocumentType;

export function DashboardPage() {
  const { documents, isLoading, isError, error } = useDocuments();
  const [filter, setFilter] = useState<Filter>('all');
  const [showUpload, setShowUpload] = useState(false);

  const completed = documents.filter(d => d.status === DocumentStatus.COMPLETED);
  const processing = documents.filter(
    d => d.status === DocumentStatus.PROCESSING || d.status === DocumentStatus.PENDING
  );
  const avgConfidence = completed.length > 0
    ? Math.round(completed.reduce((sum, d) => sum + (d.confidenceScore ?? 0), 0) / completed.length * 100)
    : 0;

  const filtered = filter === 'all'
    ? documents
    : documents.filter(d => d.documentType === filter);

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Documents</div>
          <div className="page-header__sub">Upload and process invoices, contracts and reports</div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--secondary btn--sm">
            <i className="ti ti-filter" aria-hidden="true" style={{ fontSize: '14px' }} />
            Filter
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => setShowUpload(v => !v)}>
            <i className="ti ti-upload" aria-hidden="true" style={{ fontSize: '14px' }} />
            Upload document
          </button>
        </div>
      </div>

      <div className="page-content">
        {isError && error && <ErrorBanner message={error.message} />}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">
              <i className="ti ti-files" aria-hidden="true" />
              Total documents
            </div>
            <div className="stat-card__value">{documents.length}</div>
            <div className="stat-card__change">All time uploads</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">
              <i className="ti ti-circle-check" aria-hidden="true" style={{ color: 'var(--color-success)' }} />
              Processed
            </div>
            <div className="stat-card__value" style={{ color: 'var(--color-success-text)' }}>
              {completed.length}
            </div>
            <div className="stat-card__change up">
              {documents.length > 0
                ? `${Math.round(completed.length / documents.length * 100)}% success rate`
                : 'No documents yet'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">
              <i className="ti ti-loader" aria-hidden="true" style={{ color: 'var(--color-warning)' }} />
              Processing
            </div>
            <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>
              {processing.length}
            </div>
            <div className="stat-card__change">Active AI jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">
              <i className="ti ti-star" aria-hidden="true" style={{ color: 'var(--color-primary-text)' }} />
              Avg confidence
            </div>
            <div className="stat-card__value" style={{ color: 'var(--color-primary-text)' }}>
              {completed.length > 0 ? `${avgConfidence}%` : '—'}
            </div>
            <div className="stat-card__change">AI extraction score</div>
          </div>
        </div>

        {showUpload && (
          <UploadZone onSuccess={() => setShowUpload(false)} />
        )}

        {!showUpload && (
          <div
            className="upload-zone"
            onClick={() => setShowUpload(true)}
            style={{ padding: '16px', marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div className="upload-zone__icon" style={{ margin: 0, width: '32px', height: '32px' }}>
                <i className="ti ti-cloud-upload" aria-hidden="true" style={{ fontSize: '16px' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="upload-zone__title" style={{ fontSize: '13px' }}>Drop a document or click to upload</div>
                <div className="upload-zone__sub">PDF · DOCX · JPEG · PNG · CSV · XLSX · TXT · Max 20MB</div>
              </div>
              <button className="btn btn--primary btn--sm" style={{ marginLeft: 'auto' }} onClick={e => { e.stopPropagation(); setShowUpload(true); }}>
                Choose file
              </button>
            </div>
          </div>
        )}

        {showUpload && (
          <div style={{ marginBottom: '8px' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowUpload(false)}>
              <i className="ti ti-x" aria-hidden="true" style={{ fontSize: '14px' }} /> Cancel
            </button>
          </div>
        )}

        <div className="section-header">
          <div className="section-title">Recent documents</div>
          <div className="filter-row">
            {(['all', 'invoice', 'contract', 'report'] as const).map(f => (
              <button
                key={f}
                className={`filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f as Filter)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="loading">
            <div className="spinner" />
            Loading documents…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="ti ti-files" aria-hidden="true" />
            </div>
            <div className="empty-state__title">No documents yet</div>
            <div className="empty-state__text">Upload your first document to get started</div>
          </div>
        ) : (
          <DocumentTable documents={filtered} />
        )}
      </div>
    </>
  );
}