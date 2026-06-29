'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function AnomaliesContainer() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authFetch('/api/admin/anomalies?limit=100');
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
      const res = await authFetch('/api/admin/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (anomalies.length === 0) {
    return <p className="text-muted-foreground">No anomalies found.</p>;
  }

  return (
    <div className="space-y-4">
      {anomalies.map((a) => (
        <Card key={a.id} className="p-4 border-border bg-card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-medium">{a.type}</p>
              <p className="text-sm text-muted-foreground">{a.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Severity: {a.severity} · {a.resolved ? 'Resolved' : 'Open'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggleResolved(a.id, !a.resolved)}>
              {a.resolved ? 'Reopen' : 'Resolve'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}