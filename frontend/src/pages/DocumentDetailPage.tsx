import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../hooks/useDocuments';
import { ExtractionResult } from '../components/ExtractionResult/ExtractionResult';
import { StatusBadge, TypeBadge } from '../components/StatusBadge/StatusBadge';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';
import { DocumentStatus } from '../types/document.types';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, isLoading, isError, error } = useDocument(id ?? '');

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading">Loading document…</div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="page">
        <div className="page__main">
          <ErrorBanner message={error?.message ?? 'Document not found'} />
          <button className="btn btn--secondary" onClick={() => navigate('/')}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__header-inner">
          <div>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate('/')}
            >
              ← Back
            </button>
            <h1 className="page__title page__title--detail">
              {document.originalName}
            </h1>
            <div className="page__badges">
              <TypeBadge type={document.documentType} />
              <StatusBadge status={document.status} />
            </div>
          </div>
        </div>
      </header>

      <main className="page__main">
        {document.status === DocumentStatus.PROCESSING ||
        document.status === DocumentStatus.PENDING ? (
          <div className="processing-state">
            <div className="spinner spinner--lg" />
            <p className="processing-state__text">
              AI is extracting data from your document…
            </p>
          </div>
        ) : document.status === DocumentStatus.FAILED ? (
          <div className="failed-state">
            <ErrorBanner
              message={document.errorMessage ?? 'Processing failed'}
            />
          </div>
        ) : document.extractedData ? (
          <ExtractionResult
            documentType={document.documentType}
            data={document.extractedData}
          />
        ) : null}
      </main>
    </div>
  );
}