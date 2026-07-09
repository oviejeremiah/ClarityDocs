import { DocumentType } from '../../types/document.types';

interface ExtractionResultProps {
  documentType: DocumentType;
  data: Record<string, unknown>;
  documentName?: string;
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
            {typeof item === 'object' && item !== null ? (
              <div className="nested-object">
                {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="nested-row">
                    <span className="nested-key">{k}</span>
                    <ValueDisplay value={v} />
                  </div>
                ))}
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

function flattenForCsv(
  data: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      result[fullKey] = '';
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result[fullKey] = '';
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        value.forEach((item, i) => {
          const nested = flattenForCsv(
            item as Record<string, unknown>,
            `${fullKey}[${i}]`,
          );
          Object.assign(result, nested);
        });
      } else {
        result[fullKey] = value.join('; ');
      }
    } else if (typeof value === 'object') {
      const nested = flattenForCsv(value as Record<string, unknown>, fullKey);
      Object.assign(result, nested);
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function downloadCsv(
  data: Record<string, unknown>,
  documentType: string,
  documentName: string,
) {
  const flat = flattenForCsv(data);
  const headers = Object.keys(flat);
  const values = Object.values(flat);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${documentName.replace(/\.[^.]+$/, '')}_extracted_${documentType}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadJson(
  data: Record<string, unknown>,
  documentType: string,
  documentName: string,
) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${documentName.replace(/\.[^.]+$/, '')}_extracted_${documentType}.json`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExtractionResult({
  documentType,
  data,
  documentName = 'document',
}: ExtractionResultProps) {
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
        <div className="extraction-result__actions">
          {data.confidence !== undefined && (
            <div className="confidence-score">
              <span className="confidence-score__label">AI confidence</span>
              <span className="confidence-score__value">
                {Math.round((data.confidence as number) * 100)}%
              </span>
            </div>
          )}
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => downloadCsv(data, documentType, documentName)}
            title="Download extracted data as CSV"
          >
            ↓ CSV
          </button>
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => downloadJson(data, documentType, documentName)}
            title="Download extracted data as JSON"
          >
            ↓ JSON
          </button>
        </div>
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