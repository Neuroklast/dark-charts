'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
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

const CACHE_TTL_MS = 30_000;
const CACHE_MAX_PAGES = 40;

/** Page cache is per component mount: never shared between different admin sessions. */
export class AdminPageCache<T> {
  private items = new Map<string, { data: AdminListResult<T>; at: number }>();
  get(key: string, now = Date.now()) {
    const cached = this.items.get(key);
    if (!cached || now - cached.at > CACHE_TTL_MS) return null;
    this.items.delete(key);
    this.items.set(key, cached);
    return cached.data;
  }
  put(key: string, data: AdminListResult<T>, now = Date.now()) {
    this.items.delete(key);
    this.items.set(key, { data, at: now });
    if (this.items.size > CACHE_MAX_PAGES) this.items.delete(this.items.keys().next().value!);
  }
  invalidate(key: string) { this.items.delete(key); }
  clear() { this.items.clear(); }
}

export function useAdminList<T>(
  url: string,
  transform: (json: any) => AdminListResult<T>,
  onError?: (message: string) => void
) {
  const [rows, setRowsState] = useState<T[]>([]);
  const [total, setTotalState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const seq = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const cache = useRef(new AdminPageCache<T>());
  const transformRef = useRef(transform);
  const errorRef = useRef(onError);
  transformRef.current = transform;
  errorRef.current = onError;

  const setRows = useCallback((value: SetStateAction<T[]>) => {
    cache.current.invalidate(url);
    setRowsState(value);
  }, [url]);
  const setTotal = useCallback((value: SetStateAction<number>) => {
    cache.current.invalidate(url);
    setTotalState(value);
  }, [url]);

  const refresh = useCallback(async (background = false) => {
    const request = ++seq.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    if (!background) {
      const cached = cache.current.get(url);
      if (cached) {
        setRowsState(cached.rows);
        setTotalState(cached.total);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setRowsState([]);
      setTotalState(0);
      setLoading(true);
    } else setRefreshing(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await authFetch(url, { signal: controller.signal, cache: 'no-store' });
        if ((res.status === 429 || res.status === 503) && attempt < 2) {
          await new Promise<void>(resolve => {
            const timer = setTimeout(resolve, 250 * (attempt + 1));
            controller.signal.addEventListener('abort', () => {
              clearTimeout(timer); resolve();
            }, { once: true });
          });
          if (controller.signal.aborted) return;
          continue;
        }
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || `HTTP ${res.status}`);
        }
        const data = transformRef.current(await res.json());
        if (request === seq.current && !controller.signal.aborted) {
          cache.current.put(url, data);
          setRowsState(data.rows);
          setTotalState(data.total);
        }
        return;
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
