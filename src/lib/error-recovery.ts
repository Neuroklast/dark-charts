export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenRetries?: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
    signal
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error instanceof NonRetryableError) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      if (onRetry) {
        try {
          onRetry(error, attempt, delayMs);
        } catch (callbackError) {
          console.error('Error in retry callback:', callbackError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successfulHalfOpenCalls = 0;

  constructor(private options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      halfOpenRetries: 1,
      ...options
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.successfulHalfOpenCalls = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successfulHalfOpenCalls++;
      if (this.successfulHalfOpenCalls >= (this.options.halfOpenRetries || 1)) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= (this.options.failureThreshold || 5)) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= (this.options.resetTimeoutMs || 60000);
  }

  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successfulHalfOpenCalls = 0;
    this.lastFailureTime = null;
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

export class RecoveryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  
  getOrCreateCircuitBreaker(key: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker(options));
    }
    return this.circuitBreakers.get(key)!;
  }

  async executeWithRecovery<T>(
    key: string,
    operation: () => Promise<T>,
    options: RetryOptions & CircuitBreakerOptions = {}
  ): Promise<T> {
    const breaker = this.getOrCreateCircuitBreaker(key, options);
    
    return breaker.execute(() => 
      retryWithBackoff(operation, options)
    );
  }

  clearCircuitBreaker(key: string): void {
    this.circuitBreakers.delete(key);
  }

  getAllStates(): Map<string, CircuitState> {
    const states = new Map<string, CircuitState>();
    this.circuitBreakers.forEach((breaker, key) => {
      states.set(key, breaker.getState());
    });
    return states;
  }
}

export const globalRecoveryManager = new RecoveryManager();

export function withRecovery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  options?: RetryOptions & CircuitBreakerOptions
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return globalRecoveryManager.executeWithRecovery(
      key,
      () => fn(...args),
      options
    );
  }) as T;
}

export function createFailsafe<T>(
  operation: () => Promise<T>,
  fallback: T,
  options?: {
    timeout?: number;
    onError?: (error: unknown) => void;
  }
): Promise<T> {
  return new Promise(async (resolve) => {
    const { timeout = 5000, onError } = options || {};
    
    const timeoutId = setTimeout(() => {
      if (onError) {
        onError(new Error('Operation timeout'));
      }
      resolve(fallback);
    }, timeout);

    try {
      const result = await operation();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      if (onError) {
        onError(error);
      }
      resolve(fallback);
    }
  });
}

export async function batchWithRecovery<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    continueOnError?: boolean;
    onItemError?: (item: T, error: unknown) => void;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 5,
    continueOnError = true,
    onItemError
  } = options;

  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      try {
        return await operation(item);
      } catch (error) {
        if (onItemError) {
          onItemError(item, error);
        }
        if (!continueOnError) {
          throw error;
        }
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r: R | null): r is R => r !== null));
  }

  return results;
}

interface CacheOptions {
  ttlMs?: number;
  onStale?: (key: string) => void;
}

export class ResilienceCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  
  constructor(private options: CacheOptions = {}) {
    this.options = {
      ttlMs: 300000,
      ...options
    };
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const age = Date.now() - entry.timestamp;
    if (age > (this.options.ttlMs || 300000)) {
      if (this.options.onStale) {
        this.options.onStale(key);
      }
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStale(key: string): T | undefined {
    const entry = this.cache.get(key);
    return entry?.value;
  }
}

export async function staleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cache: ResilienceCache<T>,
  options: {
    returnStaleOnError?: boolean;
    onRevalidate?: (value: T) => void;
  } = {}
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached) {
    fetchFn()
      .then(fresh => {
        cache.set(key, fresh);
        if (options.onRevalidate) {
          options.onRevalidate(fresh);
        }
      })
      .catch(error => {
        console.error('Background revalidation failed:', error);
      });
    
    return cached;
  }

  try {
    const fresh = await fetchFn();
    cache.set(key, fresh);
    return fresh;
  } catch (error) {
    if (options.returnStaleOnError) {
      const stale = cache.getStale(key);
      if (stale !== undefined) {
        return stale;
      }
    }
    throw error;
  }
}
