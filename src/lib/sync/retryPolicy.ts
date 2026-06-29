const ITUNES_RETRY = { maxRetries: 3, baseDelayMs: 500 };

export async function withItunesRetry<T>(
  fn: () => Promise<T>,
  label = 'itunes'
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= ITUNES_RETRY.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= ITUNES_RETRY.maxRetries) break;
      const delay = ITUNES_RETRY.baseDelayMs * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} request failed`);
}