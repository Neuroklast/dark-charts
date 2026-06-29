'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { ReleaseCatalogView, type AdminRelease } from './ReleaseCatalogView';

export function ReleaseCatalogContainer() {
  const [releases, setReleases] = useState<AdminRelease[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      if (visibility !== 'all') params.set('visibility', visibility);

      const res = await authFetch(`/api/admin/releases?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReleases(data.releases ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load releases');
    } finally {
      setIsLoading(false);
    }
  }, [search, visibility]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const postAction = async (body: Record<string, unknown>) => {
    const res = await authFetch('/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
  };

  const handleToggleVisibility = async (releaseId: string, isVisible: boolean) => {
    const prev = [...releases];
    setReleases(releases.map((r) => (r.id === releaseId ? { ...r, isVisible } : r)));
    try {
      await postAction({ action: 'toggle_visibility', releaseId, isVisible });
      toast.success(isVisible ? 'Release visible' : 'Release hidden');
    } catch {
      setReleases(prev);
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (releaseId: string) => {
    if (!window.confirm('Delete this release from the catalog?')) return;
    try {
      await postAction({ action: 'delete', releaseId });
      toast.success('Release deleted');
      await load();
    } catch {
      toast.error('Failed to delete release');
    }
  };

  const handleSyncArtwork = async () => {
    try {
      const res = await authFetch('/api/sync/itunes/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25, onlyMissing: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Artwork sync started (${data.synced ?? 0} synced)`);
    } catch {
      toast.error('Artwork sync failed');
    }
  };

  return (
    <ReleaseCatalogView
      releases={releases}
      total={total}
      search={search}
      visibility={visibility}
      isLoading={isLoading}
      onSearchChange={setSearch}
      onVisibilityChange={setVisibility}
      onToggleVisibility={handleToggleVisibility}
      onDelete={handleDelete}
      onSyncArtwork={handleSyncArtwork}
    />
  );
}