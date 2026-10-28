'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { ReleaseCatalogView, type AdminRelease } from './ReleaseCatalogView';
import { useAdminList, useDebouncedValue } from './shared/useAdminList';
import { AdminBulkJobProgress } from './shared/AdminBulkJobProgress';
import { AdminBulkJobHistory } from './shared/AdminBulkJobHistory';

export function ReleaseCatalogContainer() {
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [allMatching, setAllMatching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(() => new URLSearchParams({
    limit: String(pageSize), offset: String(page * pageSize), search: debouncedSearch, visibility,
  }).toString(), [page, pageSize, debouncedSearch, visibility]);
  const { rows, total, loading, refreshing, refresh, setRows, setTotal } = useAdminList<AdminRelease>(
    '/api/admin/releases?' + params, data => ({ rows: data.releases ?? [], total: data.total ?? 0 }),
    message => toast.error(message)
  );

  function reset() { setSelected([]); setAllMatching(false); }
  const updateFilter = (next: { search?: string; visibility?: string; pageSize?: number }) => {
    if (next.search !== undefined) setSearch(next.search);
    if (next.visibility !== undefined) setVisibility(next.visibility);
    if (next.pageSize !== undefined) setPageSize(next.pageSize);
    setPage(0); reset();
  };

  const postAction = async (body: Record<string, unknown>) => {
    const res = await authFetch('/api/admin/releases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
  };

  const handleToggleVisibility = async (releaseId: string, isVisible: boolean) => {
    setRows(list => list.map(r => r.id === releaseId ? { ...r, isVisible } : r));
    try {
      await postAction({ action: 'toggle_visibility', releaseId, isVisible });
      if (visibility !== 'all') {
        setRows(list => list.filter(r => r.id !== releaseId));
        setTotal(n => Math.max(0, n - 1));
      }
      toast.success(isVisible ? 'Release freigegeben' : 'Release verborgen');
    } catch (error) {
      setRows(list => list.map(r => r.id === releaseId ? { ...r, isVisible: !isVisible } : r));
      toast.error(error instanceof Error ? error.message : 'Änderung fehlgeschlagen');
    }
  };

  const handleDelete = async (releaseId: string) => {
    if (!window.confirm('Release wirklich löschen?')) return;
    try {
      await postAction({ action: 'delete', releaseId });
      setRows(list => list.filter(r => r.id !== releaseId));
      setTotal(n => Math.max(0, n - 1));
      setSelected(ids => ids.filter(id => id !== releaseId));
      toast.success('Release gelöscht');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
    }
  };

  const handleBulk = async (operation: 'approve' | 'hide') => {
    const count = allMatching ? total : selected.length;
    if (!count || busy) return;
    if (!window.confirm(`${count} Releases ${operation === 'approve' ? 'freigeben' : 'verbergen'}? ${allMatching ? 'Auch Treffer außerhalb dieser Seite.' : ''}`)) return;
    setBusy(true);
    try {
      const res = await authFetch('/api/admin/catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'releases', action: 'bulk', operation,
          ...(allMatching ? { allMatching: true, visibility, search: debouncedSearch } : { ids: selected }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sammelaktion fehlgeschlagen');
      if (data.jobId) { setBulkJobId(data.jobId); toast.success('Sammelaktion eingeplant'); }
      else toast.success('Keine Änderungen erforderlich');
      reset();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Sammelaktion fehlgeschlagen'); }
    finally { setBusy(false); }
  };

  const handleSyncArtwork = async () => {
    try {
      const res = await authFetch('/api/sync/itunes/artwork', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25, onlyMissing: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Artwork-Synchronisierung: ${data.synced ?? 0} bearbeitet`);
    } catch { toast.error('Artwork-Synchronisierung fehlgeschlagen'); }
  };

  return (
    <div className="space-y-3">
      <AdminBulkJobHistory onOpen={setBulkJobId} refreshKey={bulkJobId} />
      <AdminBulkJobProgress jobId={bulkJobId} onDismiss={() => setBulkJobId(null)}
        onFinished={() => { void refresh(true); toast.success('Sammelaktion abgeschlossen'); }} />
    <ReleaseCatalogView releases={rows} total={total} search={search} visibility={visibility}
      isLoading={loading} isRefreshing={refreshing} page={page} pageSize={pageSize}
      selectedIds={selected} allMatching={allMatching} isBusy={busy || bulkJobId !== null}
      onSelect={setSelected} onAllMatchingChange={setAllMatching}
      onBulkApprove={() => void handleBulk('approve')} onBulkHide={() => void handleBulk('hide')}
      onPageChange={value => { setPage(value); }}
      onPageSizeChange={size => updateFilter({ pageSize: size })}
      onSearchChange={value => updateFilter({ search: value })}
      onVisibilityChange={value => updateFilter({ visibility: value })}
      onToggleVisibility={handleToggleVisibility} onDelete={handleDelete}
      onSyncArtwork={handleSyncArtwork} onRefresh={() => void refresh(true)} />
    </div>
  );
}
