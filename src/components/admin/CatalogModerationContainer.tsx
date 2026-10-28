'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Entity = 'artists' | 'releases';
type CatalogRow = {
  id: string;
  name?: string;
  title?: string;
  genres?: string[];
  source?: string | null;
  status?: string;
  isVisible: boolean;
  releaseDate?: string;
  artist?: { id: string; name: string; isVisible: boolean } | null;
};
type ModerationResponse = { items: CatalogRow[]; count: number; entity: Entity };

export function CatalogModerationContainer() {
  const [entity, setEntity] = useState<Entity>('artists');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/catalog?entity=${entity}&filter=${filter}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ModerationResponse;
      setRows(data.items);
      setCount(data.count);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [entity, filter]);

  useEffect(() => { void load(); }, [load]);

  async function act(row: CatalogRow, action: 'approve' | 'reject' | 'hide' | 'sync') {
    setBusy(row.id);
    try {
      const res = await authFetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id: row.id, action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
      toast.success(`${action} complete${result.jobsQueued ? ' — synchronization queued' : ''}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed');
    } finally {
      setBusy(null);
    }
  }

  async function importBatch() {
    setBusy('import');
    try {
      const res = await authFetch('/api/admin/seed/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset, limit: 25, enqueueSync: false }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
      setOffset(result.nextOffset);
      toast.success(`Imported privately: ${result.created} new, ${result.updated} updated, ${result.skipped} skipped`);
      if (result.errors?.length) toast.error(`${result.errors.length} import errors — inspect server logs`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant={entity === 'artists' ? 'default' : 'outline'} onClick={() => setEntity('artists')}>Artists</Button>
        <Button variant={entity === 'releases' ? 'default' : 'outline'} onClick={() => setEntity('releases')}>Releases</Button>
        <Button variant={filter === 'pending' ? 'secondary' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
        <Button variant={filter === 'all' ? 'secondary' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant="ghost" onClick={() => void load()} disabled={loading}>Refresh</Button>
      </div>
      {entity === 'artists' && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Controlled CSV intake: 25 records per batch. Imported artists are hidden until you approve them.
            No mass publication or automatic sync.
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <Button disabled={busy !== null} onClick={() => void importBatch()}>
              Import next 25 CSV artists
            </Button>
            <span className="text-sm text-muted-foreground">CSV offset: {offset}</span>
            <Button variant="outline" onClick={() => setOffset(0)}>Restart intake</Button>
          </div>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">{count} matching records · displaying up to 100</p>
      {loading ? <p className="text-muted-foreground">Loading...</p> : rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No records in this queue.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" key={row.id}>
              <div className="min-w-0">
                <p className="font-medium break-words">{row.name || row.title}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {entity === 'releases' ? `${row.artist?.name ?? 'Unknown artist'} · ${row.releaseDate ?? ''}` :
                    row.genres?.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.source || 'manual'} · {row.isVisible ? 'Approved' : row.status || 'Awaiting approval'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!row.isVisible && <Button size="sm" onClick={() => void act(row, 'approve')} disabled={busy !== null}>Approve</Button>}
                {row.isVisible && <Button size="sm" variant="outline" onClick={() => void act(row, 'hide')} disabled={busy !== null}>Hide</Button>}
                {entity === 'artists' && row.isVisible &&
                  <Button size="sm" variant="secondary" onClick={() => void act(row, 'sync')} disabled={busy !== null}>Queue sync</Button>}
                {!row.isVisible && <Button size="sm" variant="destructive" onClick={() => void act(row, 'reject')} disabled={busy !== null}>Reject</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
