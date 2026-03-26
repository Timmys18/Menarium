const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function estimateDataUrlBytes(dataUrl: string): number {
  const parts = dataUrl.split(',');
  if (parts.length < 2) return 0;
  const base64 = parts[1];
  const padding = (base64.match(/=+$/)?.[0].length ?? 0);
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function validateImageList(input: unknown):
  | { ok: true; images: string[] }
  | { ok: false; error: string } {
  const images = Array.isArray(input) ? input : [];

  for (const value of images) {
    if (typeof value !== 'string' || !value.trim()) {
      return { ok: false, error: 'Некорректный формат изображения.' };
    }

    if (value.startsWith('data:')) {
      if (!value.startsWith('data:image/')) {
        return { ok: false, error: 'Разрешены только изображения формата image/*.' };
      }
      if (estimateDataUrlBytes(value) > MAX_IMAGE_BYTES) {
        return { ok: false, error: 'Размер изображения превышает 5MB.' };
      }
      continue;
    }

    if (!/^https?:\/\//i.test(value)) {
      return { ok: false, error: 'Некорректная ссылка на изображение.' };
    }
  }

  return { ok: true, images: images.map(String) };
}

