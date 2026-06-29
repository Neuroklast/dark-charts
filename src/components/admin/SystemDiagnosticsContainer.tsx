'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { SystemDiagnosticsView } from './SystemDiagnosticsView';

export function SystemDiagnosticsContainer() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/system');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDiagnostics(data.diagnostics);
    } catch {
      toast.error('Failed to load system diagnostics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSyncArtwork = async () => {
    try {
      const res = await authFetch('/api/sync/itunes/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25, onlyMissing: true }),
      });
      if (!res.ok) throw new Error();
      toast.success('Artwork sync triggered');
      await load();
    } catch {
      toast.error('Artwork sync failed');
    }
  };

  const handleRecalculate = async () => {
    try {
      const res = await authFetch('/api/admin/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate_week' }),
      });
      if (!res.ok) throw new Error();
      toast.success('Recalculation started');
    } catch {
      toast.error('Recalculation failed');
    }
  };

  return (
    <SystemDiagnosticsView
      diagnostics={diagnostics}
      isLoading={isLoading}
      onSyncArtwork={handleSyncArtwork}
      onRecalculate={handleRecalculate}
    />
  );
}