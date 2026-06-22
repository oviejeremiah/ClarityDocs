export abstract class BaseExtractor {
  abstract extract(data: Record<string, unknown>): Record<string, unknown>;

  protected safeString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      return value.trim() || null;
    }
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value).trim() || null;
    }
    return null;
  }

  protected safeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  protected safeBoolean(value: unknown): boolean {
    return Boolean(value);
  }

  protected safeArray<T>(value: unknown): T[] {
    if (!Array.isArray(value)) return [];
    return value as T[];
  }

  protected safeObject(value: unknown): Record<string, unknown> | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return null;
  }
}
