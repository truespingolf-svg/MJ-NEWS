/**
 * Recursively strips `undefined` object keys (and normalizes array elements)
 * so Firestore setDoc/addDoc never throws on nested undefined fields.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Estimates serialized JSON byte length for Firestore 1MB safety checks.
 */
export function estimateJsonBytes(data: unknown): number {
  const str = JSON.stringify(data) || '';
  return new TextEncoder().encode(str).length;
}
