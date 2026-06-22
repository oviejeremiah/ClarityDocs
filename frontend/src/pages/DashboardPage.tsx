import { useDocuments } from '../hooks/useDocuments';
import { UploadZone } from '../components/UploadZone/UploadZone';
import { DocumentCard } from '../components/DocumentCard/DocumentCard';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';
import { DocumentStatus } from '../types/document.types';

export function DashboardPage() {
  const { documents, isLoading, isError, error } = useDocuments();

  const processing = documents.filter(
    (d) =>
      d.status === DocumentStatus.PENDING ||
      d.status === DocumentStatus.PROCESSING,
  );
  const completed = documents.filter(
    (d) => d.status === DocumentStatus.COMPLETED,
  );
  const failed = documents.filter((d) => d.status === DocumentStatus.FAILED);

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__header-inner">
          <div>
            <h1 className="page__title">ClarityDocs</h1>
            <p className="page__subtitle">Turn documents into decisions</p>
          </div>
          <div className="page__stats">
            <div className="stat">
              <span className="stat__value">{documents.length}</span>
              <span className="stat__label">Total</span>
            </div>
            <div className="stat">
              <span className="stat__value">{completed.length}</span>
              <span className="stat__label">Processed</span>
            </div>
            <div className="stat">
              <span className="stat__value">{processing.length}</span>
              <span className="stat__label">Processing</span>
            </div>
          </div>
        </div>
      </header>

      <main className="page__main">
        {isError && error && <ErrorBanner message={error.message} />}

        <section className="section">
          <h2 className="section__title">Upload document</h2>
          <UploadZone />
        </section>

        {isLoading ? (
          <div className="loading" aria-live="polite">
            Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">
              No documents yet. Upload your first PDF to get started.
            </p>
          </div>
        ) : (
          <>
            {processing.length > 0 && (
              <section className="section">
                <h2 className="section__title">Processing</h2>
                <div className="doc-list">
                  {processing.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </section>
            )}

            {failed.length > 0 && (
              <section className="section">
                <h2 className="section__title">Failed</h2>
                <div className="doc-list">
                  {failed.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section className="section">
                <h2 className="section__title">Completed</h2>
                <div className="doc-list">
                  {completed.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}