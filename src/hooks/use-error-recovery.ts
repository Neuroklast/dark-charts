import { useState, useCallback, useEffect, useRef } from 'react';
import {
  globalRecoveryManager,
  NonRetryableError,
  type RetryOptions,
  type CircuitBreakerOptions
} from '@/lib/error-recovery';

interface UseRecoveryOptions extends RetryOptions, CircuitBreakerOptions {
  key: string;
  autoRetry?: boolean;
  notifyOnRecovery?: boolean;
}

interface RecoveryState {
  isRetrying: boolean;
  retryAttempt: number;
  lastError: Error | null;
  isRecovered: boolean;
  circuitState: 'closed' | 'open' | 'half-open';
}

export function useErrorRecovery<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  options: UseRecoveryOptions
): [T, RecoveryState, () => void] {
  const { key, autoRetry = true, notifyOnRecovery = true, ...recoveryOptions } = options;
  
  const [state, setState] = useState<RecoveryState>({
    isRetrying: false,
    retryAttempt: 0,
    lastError: null,
    isRecovered: false,
    circuitState: 'closed'
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateCircuitState = useCallback(() => {
    const breaker = globalRecoveryManager.getOrCreateCircuitBreaker(key);
    setState(prev => ({
      ...prev,
      circuitState: breaker.getState()
    }));
  }, [key]);

  useEffect(() => {
    const interval = setInterval(updateCircuitState, 1000);
    return () => clearInterval(interval);
  }, [updateCircuitState]);

  const manualRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastError: null,
      isRetrying: false,
      retryAttempt: 0
    }));
  }, []);

  const wrappedOperation = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setState(prev => ({
        ...prev,
        isRetrying: true,
        retryAttempt: 0,
        lastError: null,
        isRecovered: false
      }));

      try {
        const result = await globalRecoveryManager.executeWithRecovery(
          key,
          () => operation(...args),
          {
            ...recoveryOptions,
            signal: abortControllerRef.current.signal,
            onRetry: (error, attempt, delayMs) => {
              setState(prev => ({
                ...prev,
                retryAttempt: attempt,
                lastError: error instanceof Error ? error : new Error(String(error))
              }));
              
              if (recoveryOptions.onRetry) {
                recoveryOptions.onRetry(error, attempt, delayMs);
              }
            }
          }
        );

        setState(prev => ({
          ...prev,
          isRetrying: false,
          retryAttempt: 0,
          lastError: null,
          isRecovered: prev.retryAttempt > 0
        }));

        if (notifyOnRecovery && state.retryAttempt > 0) {
          console.log(`Operation "${key}" recovered after ${state.retryAttempt} attempts`);
        }

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: error instanceof Error ? error : new Error(String(error)),
          isRecovered: false
        }));

        throw error;
      } finally {
        updateCircuitState();
      }
    },
    [operation, key, recoveryOptions, notifyOnRecovery, state.retryAttempt, updateCircuitState]
  ) as T;

  return [wrappedOperation, state, manualRetry];
}

interface UseFailsafeOptions<T> {
  timeout?: number;
  fallback: T;
  onError?: (error: unknown) => void;
  shouldRetry?: boolean;
}

export function useFailsafe<T>(
  operation: () => Promise<T>,
  options: UseFailsafeOptions<T>
): {
  execute: () => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  hasTimedOut: boolean;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    setIsLoading(true);
    setError(null);
    setHasTimedOut(false);

    return new Promise((resolve) => {
      const { timeout = 5000, fallback, onError } = options;

      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        setIsLoading(false);
        if (onError) {
          onError(new Error('Operation timeout'));
        }
        resolve(fallback);
      }, timeout);

      operation()
        .then((result) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setIsLoading(false);
          resolve(result);
        })
        .catch((err) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
          if (onError) {
            onError(err);
          }
          resolve(fallback);
        });
    });
  }, [operation, options]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    execute,
    isLoading,
    error,
    hasTimedOut
  };
}

export function useAutoRecovery<T>(
  fetchFn: () => Promise<T>,
  options: {
    key: string;
    enabled?: boolean;
    interval?: number;
    maxFailures?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  refetch: () => Promise<void>;
} {
  const {
    key,
    enabled = true,
    interval = 5000,
    maxFailures = 3,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const fetch = useCallback(async () => {
    if (!enabled || consecutiveFailures >= maxFailures) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setConsecutiveFailures(0);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setConsecutiveFailures(prev => prev + 1);
      setRetryCount(prev => prev + 1);
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, enabled, consecutiveFailures, maxFailures, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    fetch();

    const intervalId = setInterval(fetch, interval);

    return () => clearInterval(intervalId);
  }, [fetch, enabled, interval]);

  return {
    data,
    isLoading,
    error,
    retryCount,
    refetch: fetch
  };
}

export { NonRetryableError };
