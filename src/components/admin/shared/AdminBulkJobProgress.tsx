'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client-fetch';
import { Button } from '@/components/ui/button';

export interface BulkJob {
  id: string; entity: string; operation: string; total: number;
  processed: number; affected: number; skipped: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error: string | null;
}

export function AdminBulkJobProgress({
  jobId, onFinished, onDismiss,
}: {
  jobId: string | null;
  onFinished: () => void;
  onDismiss: () => void;
}) {
  const [job, setJob] = useState<BulkJob | null>(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const notified = useRef<string | null>(null);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  useEffect(() => {
    if (!jobId) { setJob(null); return; }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function poll() {
      try {
        const res = await authFetch(`/api/admin/catalog/jobs/${jobId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Statusabfrage fehlgeschlagen');
        const data = await res.json() as { job: BulkJob };
        if (!active) return;
        setJob(data.job);
        setError('');
        if (data.job.status === 'completed' && notified.current !== jobId) {
          notified.current = jobId;
          finishedRef.current();
        }
        if (data.job.status === 'queued' || data.job.status === 'running') {
          timer = setTimeout(() => void poll(), 2000);
        }
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Jobstatus nicht erreichbar');
        timer = setTimeout(() => void poll(), 5000);
      }
    }
    void poll();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [jobId, retrying]);
  if (!jobId) return null;
  const percent = job ? Math.round((job.processed / Math.max(1, job.total)) * 100) : 0;
  return (
    <section role="status" aria-live="polite" className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{job?.status === 'completed' ? 'Sammelaktion abgeschlossen' :
          job?.status === 'failed' ? 'Sammelaktion unterbrochen' : 'Sammelaktion läuft'}</strong>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>Schließen</Button>
      </div>
      <div className="h-2 overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-muted-foreground">
        {job ? `${job.processed} von ${job.total} geprüft · ${job.affected} geändert · ${job.skipped} übersprungen (${percent} %)` : 'Auftrag wird geladen…'}
      </p>
      {(job?.error || error) && <p className="text-destructive">{job?.error || error}</p>}
      {job?.status === 'failed' &&
        <Button type="button" variant="outline" size="sm" disabled={retrying} onClick={async () => {
          setRetrying(true);
          try {
            const response = await authFetch(`/api/admin/catalog/jobs/${jobId}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'retry' }),
            });
            if (!response.ok) throw new Error('Wiederholung fehlgeschlagen');
            setJob({ ...job, status: 'queued', error: null });
            setError('');
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Wiederholung fehlgeschlagen');
          } finally { setRetrying(false); }
        }}>Ab fehlgeschlagenem Schritt fortsetzen</Button>}
    </section>
  );
}
