'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminPagination } from './shared/AdminPagination';
import { AdminBulkToolbar } from './shared/AdminBulkToolbar';
import { AdminBulkJobProgress } from './shared/AdminBulkJobProgress';
import { AdminBulkJobHistory } from './shared/AdminBulkJobHistory';
import { useAdminList, useDebouncedValue } from './shared/useAdminList';

type Entity = 'artists' | 'releases';
type CatalogRow = {
  id: string; name?: string; title?: string; genres?: string[];
  source?: string | null; status?: string; isVisible: boolean;
  releaseDate?: string; artist?: { id: string; name: string; isVisible: boolean } | null;
};

export function CatalogModerationContainer() {
  const [entity, setEntity] = useState<Entity>('artists');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [allMatching, setAllMatching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(() => new URLSearchParams({
    entity, filter, search: debouncedSearch, page: String(page), limit: String(pageSize),
  }).toString(), [entity, filter, debouncedSearch, page, pageSize]);
  const { rows, total, loading, refreshing, refresh, setRows, setTotal } = useAdminList<CatalogRow>(
    '/api/admin/catalog?' + params,
    data => ({ rows: data.items ?? [], total: data.count ?? 0 }),
    error => toast.error(error)
  );
  const reset = () => { setSelected([]); setAllMatching(false); };
  const changeFilters = (changes: { entity?: Entity; filter?: 'pending' | 'all'; search?: string; size?: number }) => {
    if (changes.entity) setEntity(changes.entity);
    if (changes.filter) setFilter(changes.filter);
    if (changes.search !== undefined) setSearch(changes.search);
    if (changes.size) setPageSize(changes.size);
    setPage(0);
    reset();
  };

  async function act(row: CatalogRow, action: 'approve' | 'reject' | 'hide' | 'sync') {
    if (busy) return;
    setBusy(row.id);
    const original = row;
    if (action !== 'sync') setRows(list => list.map(item => item.id === row.id
      ? { ...item, isVisible: action === 'approve', status: action === 'approve' ? 'active' : 'inactive' } : item));
    try {
      const res = await authFetch('/api/admin/catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id: row.id, action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
      toast.success(action === 'sync' ? 'Synchronisierung eingeplant' : 'Eintrag aktualisiert');
      if (filter === 'pending' && action !== 'sync') {
        setRows(list => list.filter(item => item.id !== row.id));
        setTotal(count => Math.max(0, count - 1));
      }
    } catch (error) {
      setRows(list => list.map(item => item.id === row.id ? original : item));
      toast.error(error instanceof Error ? error.message : 'Moderation fehlgeschlagen');
    } finally { setBusy(null); }
  }

  async function bulk(operation: 'approve' | 'hide') {
    const amount = allMatching ? total : selected.length;
    if (!amount || busy) return;
    if (!window.confirm(`${amount} ${entity === 'artists' ? 'Artists' : 'Releases'} ${operation === 'approve' ? 'freigeben' : 'verbergen'}? ${allMatching ? 'Alle Filtertreffer auf allen Seiten werden berücksichtigt.' : ''}`)) return;
    setBusy('bulk');
    try {
      const res = await authFetch('/api/admin/catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk', entity, operation,
          ...(allMatching ? { allMatching: true, search: debouncedSearch, filter } : { ids: selected }),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
      if (result.jobId) { setBulkJobId(result.jobId); toast.success('Sammelaktion eingeplant'); }
      else toast.success('Keine Änderungen erforderlich');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sammelaktion fehlgeschlagen');
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant={entity === 'artists' ? 'default' : 'outline'} onClick={() => changeFilters({ entity: 'artists' })}>Artists</Button>
        <Button size="sm" variant={entity === 'releases' ? 'default' : 'outline'} onClick={() => changeFilters({ entity: 'releases' })}>Releases</Button>
        <Button size="sm" variant={filter === 'pending' ? 'secondary' : 'outline'} onClick={() => changeFilters({ filter: 'pending' })}>Offen</Button>
        <Button size="sm" variant={filter === 'all' ? 'secondary' : 'outline'} onClick={() => changeFilters({ filter: 'all' })}>Alle</Button>
        <Input aria-label="Katalog durchsuchen" value={search} onChange={event => changeFilters({ search: event.target.value })}
          className="max-w-56" placeholder="Name oder Titel suchen" />
        <Button size="sm" variant="ghost" onClick={() => void refresh(true)} disabled={refreshing}>Aktualisieren</Button>
      </div>
      {entity === 'artists' && <p className="text-xs text-muted-foreground">Artists kannst du unter <Link href="/admin/artists" className="text-primary underline">Artists</Link> importieren und bearbeiten.</p>}
      <AdminBulkToolbar visibleIds={rows.filter(row => entity !== 'artists' || !['BANNED', 'RESTRICTED'].includes(row.status ?? '')).map(row => row.id)}
        selectedIds={selected} allMatching={allMatching} total={total} busy={busy !== null || bulkJobId !== null}
        onSelect={setSelected} onAllMatchingChange={setAllMatching}
        onApprove={() => void bulk('approve')} onHide={() => void bulk('hide')} />
      <AdminBulkJobProgress jobId={bulkJobId} onDismiss={() => setBulkJobId(null)}
        onFinished={() => { void refresh(true); toast.success('Sammelaktion abgeschlossen'); }} />
      <AdminPagination page={page} pageSize={pageSize} total={total} disabled={busy !== null}
        onPageChange={value => { setPage(value); }}
        onPageSizeChange={size => changeFilters({ size })} />
      <Card className="max-h-[62vh] min-h-44 overflow-auto p-0" aria-busy={loading}>
        {loading && rows.length === 0 ? <p className="p-5 text-muted-foreground">Lade Katalog…</p> :
          rows.length === 0 ? <p className="p-5 text-muted-foreground">Keine Einträge im Filter.</p> :
          <div className="divide-y divide-border">
            {rows.map(row => <div key={row.id} className="flex items-center gap-3 p-3 hover:bg-muted/20">
              <Checkbox aria-label={`${row.name || row.title} auswählen`}
                checked={allMatching || selected.includes(row.id)}
                disabled={busy !== null || (entity === 'artists' && ['BANNED', 'RESTRICTED'].includes(row.status ?? ''))}
                onCheckedChange={checked => {
                  setAllMatching(false);
                  setSelected(ids => checked ? [...new Set([...ids, row.id])] : ids.filter(id => id !== row.id));
                }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.name || row.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {entity === 'releases' ? `${row.artist?.name || 'Unbekannt'} · ${row.releaseDate || ''}` : (row.genres ?? []).join(', ')}
                  {' · '}{row.isVisible ? 'Öffentlich' : row.status || 'Freigabe offen'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!row.isVisible ? <Button size="sm" disabled={busy !== null} onClick={() => void act(row, 'approve')}>Freigeben</Button>
                  : <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act(row, 'hide')}>Verbergen</Button>}
                {entity === 'artists' && row.isVisible &&
                  <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void act(row, 'sync')}>Sync</Button>}
                {!row.isVisible &&
                  <Button size="sm" variant="destructive" disabled={busy !== null} onClick={() => void act(row, 'reject')}>Ablehnen</Button>}
              </div>
            </div>)}
          </div>}
      </Card>
      <AdminPagination page={page} pageSize={pageSize} total={total} disabled={busy !== null}
        onPageChange={value => { setPage(value); }}
        onPageSizeChange={size => changeFilters({ size })} />
    </div>
  );
}
