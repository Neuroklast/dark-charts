import { useState, useEffect, useCallback } from 'react';
import { asyncStorage } from '@/lib/storage/asyncStorage';

export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (newValue: T | ((prev: T) => T)) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    asyncStorage
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

        asyncStorage.set(key, newValue).catch(() => {});
        return newValue;
      });
    },
    [key]
  );

  return [value, setKVValue];
}
