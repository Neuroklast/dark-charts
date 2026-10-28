'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { AdminPagination } from './shared/AdminPagination';
import { useAdminList } from './shared/useAdminList';

interface AnomalyRow {
  id: string;
  type: string;
  description: string;
  severity: string;
  resolved: boolean;
}

export function AnomaliesContainer() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = useMemo(() => new URLSearchParams({
    page: String(page), limit: String(pageSize),
  }).toString(), [page, pageSize]);
  const { rows, total, loading, setRows } = useAdminList<AnomalyRow>(
    '/api/admin/anomalies?' + query,
    data => ({ rows: data.anomalies ?? [], total: data.total ?? 0 }),
    message => toast.error(message)
  );

  async function toggleResolved(anomaly: AnomalyRow) {
    if (busyId) return;
    const resolved = !anomaly.resolved;
    setBusyId(anomaly.id);
    setRows(list => list.map(row => row.id === anomaly.id ? { ...row, resolved } : row));
    try {
      const res = await authFetch('/api/admin/anomalies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyId: anomaly.id, resolved }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(resolved ? 'Marked resolved' : 'Reopened');
    } catch {
      setRows(list => list.map(row => row.id === anomaly.id ? anomaly : row));
      toast.error('Update failed');
    } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-3">
      <AdminPagination page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={size => { setPage(0); setPageSize(size); }} />
      <div className="max-h-[62vh] min-h-40 overflow-auto space-y-2" aria-busy={loading}>
        {loading && !rows.length && <p className="text-muted-foreground">Loading anomalies…</p>}
        {!loading && !rows.length && <p className="text-muted-foreground">No anomalies found.</p>}
        {rows.map(a => (
          <Card key={a.id} className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0">
              <p className="font-medium">{a.type}</p>
              <p className="text-sm text-muted-foreground">{a.description}</p>
              <p className="text-xs text-muted-foreground">Severity: {a.severity} · {a.resolved ? 'Resolved' : 'Open'}</p>
            </div>
            <Button size="sm" variant="outline" disabled={busyId !== null}
              onClick={() => void toggleResolved(a)}>{a.resolved ? 'Reopen' : 'Resolve'}</Button>
          </Card>
        ))}
      </div>
      <AdminPagination page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={size => { setPage(0); setPageSize(size); }} />
    </div>
  );
}
