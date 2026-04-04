export interface RetryOp
  maxAttempts?: number;
  maxDelayMs?: number;
  shouldRetry?: (error
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenRetries?: number;
}

  constructor(message: string, public readonly origi

}
export class NonRetryableError extends Error {
    super(message);
  }

 

    maxAttempts = 3,
    maxDelayMs = 10000,
    shouldRetry = (
    signal

 

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
       

      if (attempt === maxAttempts) {
        throw error;
      }

  throw lastError;

  priva


    this.options = {
      resetTimeout
      ..

  async execute<T>(o
      if (thi
        this.successfulHalfOpenCalls = 0;
        throw new Error('Circuit 
    }
    try {
      t

      throw error;
  }
  p

        this.reset
 


    this.failureCount++;

      this.state = 'open';
  }

    return Date.now() - this.lastFailureTime >= (this.option

    this.state = 'closed';
    this.successfulHalfOpenC
  }
  getState(): Ci
  }
  g


  private circuitBreakers = new 
  getOrCreateCircuitBreaker(key: strin
      this.circuitBreakers.set(ke
    return this.circuitBreakers.get(key)!

    key: string,
    opt
    c

    );

    this.circuitBreaker

    const states = ne
      states.set(key, b
    return states;
}
exp

  key: string,
): T {
    return globalRecoveryManager.exec
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
    results.push(...batchResults.filter((r): r is R => r !== null));
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
