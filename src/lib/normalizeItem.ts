export function normalizeToArray(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  return [];
}

export function normalizeItem(item: any) {
  return {
    ...item,
    images: normalizeToArray(item.images),
    desiredCategories: normalizeToArray(item.desiredCategories),
    additionalItemIds: normalizeToArray(item.additionalItemIds),
  };
}

