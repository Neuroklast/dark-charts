'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { ApiKeysView, type ApiKeyStatus } from './ApiKeysView';

export function ApiKeysContainer() {
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [v1Endpoints, setV1Endpoints] = useState<string[]>([]);
  const [rotationNote, setRotationNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/api-keys');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKeys(data.keys ?? []);
      setV1Endpoints(data.v1Endpoints ?? []);
      setRotationNote(data.rotationNote ?? '');
    } catch {
      toast.error('Failed to load API key status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ApiKeysView
      keys={keys}
      v1Endpoints={v1Endpoints}
      rotationNote={rotationNote}
      isLoading={isLoading}
    />
  );
}