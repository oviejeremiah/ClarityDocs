import { DocumentType } from '../../types/document.types';

interface ExtractionResultProps {
  documentType: DocumentType;
  data: Record<string, unknown>;
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="value value--null">—</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`value value--bool value--${value ? 'true' : 'false'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="value value--number">{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    return <span className="value">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="value value--null">None</span>;
    return (
      <ul className="value-list">
        {value.map((item, i) => (
          <li key={i} className="value-list__item">
            {typeof item === 'object' ? (
              <div className="nested-object">
                {Object.entries(item as Record<string, unknown>).map(
                  ([k, v]) => (
                    <div key={k} className="nested-row">
                      <span className="nested-key">{k}</span>
                      <ValueDisplay value={v} />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <ValueDisplay value={item} />
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="nested-object">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="nested-row">
            <span className="nested-key">{k}</span>
            <ValueDisplay value={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="value">{String(value)}</span>;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function ExtractionResult({ documentType, data }: ExtractionResultProps) {
  const excludeKeys = ['confidence'];

  const entries = Object.entries(data).filter(
    ([key]) => !excludeKeys.includes(key),
  );

  return (
    <div className="extraction-result">
      <div className="extraction-result__header">
        <h2 className="extraction-result__title">
          Extracted data
          <span className="extraction-result__type">{documentType}</span>
        </h2>
        {data.confidence !== undefined && (
          <div className="confidence-score">
            <span className="confidence-score__label">AI confidence</span>
            <span className="confidence-score__value">
              {Math.round((data.confidence as number) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="extraction-table">
        {entries.map(([key, value]) => (
          <div key={key} className="extraction-row">
            <div className="extraction-row__key">{formatKey(key)}</div>
            <div className="extraction-row__value">
              <ValueDisplay value={value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}