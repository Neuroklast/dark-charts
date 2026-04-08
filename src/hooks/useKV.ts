import { useState, useEffect, useCallback } from 'react';

/**
 * Local polyfill for @github/spark/hooks useKV.
 * Uses window.spark.kv which is either the real Spark KV (when running on Spark)
 * or the localStorage-backed polyfill set up in main.tsx.
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (newValue: T | ((prev: T) => T)) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    window.spark.kv
      .get<T>(key)
      .then(stored => {
        if (stored !== null && stored !== undefined) {
          setValue(stored);
        }
      })
      .catch(() => {});
  }, [key]);

  const setKVValue = useCallback(
    async (newValueOrUpdater: T | ((prev: T) => T)): Promise<void> => {
      setValue(prev => {
        const newValue =
          typeof newValueOrUpdater === 'function'
            ? (newValueOrUpdater as (prev: T) => T)(prev)
            : newValueOrUpdater;

        window.spark.kv.set(key, newValue).catch(() => {});
        return newValue;
      });
    },
    [key]
  );

  return [value, setKVValue];
}
