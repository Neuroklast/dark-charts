'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AdminAnomaliesPage() {
  const { getToken } = useAuth();
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/anomalies?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleResolved = async (anomalyId: string, resolved: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anomalyId, resolved }),
      });
      if (res.ok) {
        toast.success(resolved ? 'Marked resolved' : 'Reopened');
        await load();
      }
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="display-font text-2xl uppercase text-foreground font-semibold">Vote Anomalies</h1>
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : anomalies.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No anomalies recorded.</p>
        ) : (
          <div className="divide-y divide-border">
            {anomalies.map((a) => (
              <div key={a.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{a.anomalyType}</p>
                  <p className="text-sm text-foreground">
                    {a.release?.title ?? a.releaseId ?? '—'} · {a.severity}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.weekStart).toLocaleDateString()} · {a.resolved ? 'resolved' : 'open'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleResolved(a.id, !a.resolved)}
                >
                  {a.resolved ? 'Reopen' : 'Resolve'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}