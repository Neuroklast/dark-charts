'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { FeatureFlagsView, type FeatureFlagRow } from './FeatureFlagsView';

export function FeatureFlagsContainer() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/features');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlags(data.flags ?? []);
    } catch {
      toast.error('Failed to load feature flags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (key: string, value: boolean) => {
    const prev = [...flags];
    setFlags(flags.map((f) => (f.key === key ? { ...f, value } : f)));
    try {
      const res = await authFetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: { [key]: value } }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${value ? 'Enabled' : 'Disabled'} ${key}`);
    } catch {
      setFlags(prev);
      toast.error('Failed to update feature flag');
    }
  };

  return <FeatureFlagsView flags={flags} isLoading={isLoading} onToggle={handleToggle} />;
}