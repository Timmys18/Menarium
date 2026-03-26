export function logInfo(scope: string, message: string, meta?: unknown): void {
  if (meta !== undefined) {
    console.log(`[${scope}] ${message}`, meta);
    return;
  }
  console.log(`[${scope}] ${message}`);
}

export function logError(scope: string, message: string, error?: unknown): void {
  if (error !== undefined) {
    console.error(`[${scope}] ${message}`, error);
    return;
  }
  console.error(`[${scope}] ${message}`);
}

