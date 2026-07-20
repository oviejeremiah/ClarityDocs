export interface FieldScore {
  field: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
}

export interface EvalResult {
  documentType: string;
  provider: string;
  fieldScores: FieldScore[];
  accuracyPercent: number;
}

function normaliseValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return String(value).trim().toLowerCase();
}

function fuzzyMatch(expected: unknown, actual: unknown): boolean {
  const e = normaliseValue(expected);
  const a = normaliseValue(actual);
  if (e === a) return true;
  if (e === '' || a === '') return false;

  if (typeof expected === 'number' && typeof actual === 'number') {
    return Math.abs(expected - actual) < 0.01;
  }

  return a.includes(e) || e.includes(a);
}

export function scoreExtraction(
  groundTruth: Record<string, unknown>,
  extracted: Record<string, unknown>,
  documentType: string,
  provider: string,
): EvalResult {
  const fieldScores: FieldScore[] = Object.entries(groundTruth).map(
    ([field, expected]) => {
      const actual = extracted[field];
      return {
        field,
        expected,
        actual,
        match: fuzzyMatch(expected, actual),
      };
    },
  );

  const matchCount = fieldScores.filter((f) => f.match).length;
  const accuracyPercent = Math.round((matchCount / fieldScores.length) * 100);

  return { documentType, provider, fieldScores, accuracyPercent };
}
