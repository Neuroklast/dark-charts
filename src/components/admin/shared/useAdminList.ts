'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client-fetch';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export interface AdminListResult<T> { rows: T[]; total: number }

export function useAdminList<T>(
  url: string,
  transform: (json: any) => AdminListResult<T>,
  onError?: (message: string) => void
) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const seq = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const transformRef = useRef(transform);
  const errorRef = useRef(onError);
  transformRef.current = transform;
  errorRef.current = onError;

  const refresh = useCallback(async (background = false) => {
    const request = ++seq.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await authFetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }
      const data = transformRef.current(await res.json());
      if (request === seq.current && !controller.signal.aborted) {
        setRows(data.rows);
        setTotal(data.total);
      }
    } catch (error) {
      if (request === seq.current && !controller.signal.aborted) {
        errorRef.current?.(error instanceof Error ? error.message : 'Abruf fehlgeschlagen');
      }
    } finally {
      if (request === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [url]);

  useEffect(() => {
    void refresh(false);
    return () => { seq.current++; abort.current?.abort(); };
  }, [refresh]);

  return { rows, total, loading, refreshing, refresh, setRows, setTotal };
}
