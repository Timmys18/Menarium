export function toArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export function pickArray<T = any>(value: any, keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    for (const k of keys) {
      const v = (value as any)[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

