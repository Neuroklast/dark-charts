'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { VoteInspectorView, type VoteRow } from './VoteInspectorView';
import { useAdminList } from './shared/useAdminList';

export function VoteInspectorContainer() {
  const [type, setType] = useState<'fan' | 'expert'>('fan');
  const [weekOnly, setWeekOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const params = useMemo(() => new URLSearchParams({
    type, weekOnly: String(weekOnly), offset: String(page * pageSize), limit: String(pageSize),
  }).toString(), [type, weekOnly, page, pageSize]);
  const { rows, total, loading } = useAdminList<VoteRow>(
    '/api/admin/votes?' + params, data => ({ rows: data.votes ?? [], total: data.total ?? 0 }),
    message => toast.error(message)
  );
  return (
    <VoteInspectorView votes={rows} total={total} type={type} weekOnly={weekOnly} isLoading={loading}
      page={page} pageSize={pageSize}
      onPageChange={setPage} onPageSizeChange={size => { setPage(0); setPageSize(size); }}
      onTypeChange={value => { setType(value); setPage(0); }}
      onWeekOnlyChange={value => { setWeekOnly(value); setPage(0); }} />
  );
}
