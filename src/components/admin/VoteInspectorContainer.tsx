'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { VoteInspectorView, type VoteRow } from './VoteInspectorView';

export function VoteInspectorContainer() {
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<'fan' | 'expert'>('fan');
  const [weekOnly, setWeekOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        weekOnly: String(weekOnly),
        limit: '50',
      });
      const res = await authFetch(`/api/admin/votes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVotes(data.votes ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load votes');
    } finally {
      setIsLoading(false);
    }
  }, [type, weekOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <VoteInspectorView
      votes={votes}
      total={total}
      type={type}
      weekOnly={weekOnly}
      isLoading={isLoading}
      onTypeChange={setType}
      onWeekOnlyChange={setWeekOnly}
    />
  );
}