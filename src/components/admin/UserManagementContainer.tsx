'use client';

import { useMemo, useState } from 'react';
import { UserManagementView, type AdminUser } from './UserManagementView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { useAdminList } from './shared/useAdminList';

export function UserManagementContainer() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const params = useMemo(() => new URLSearchParams({
    page: String(page + 1), limit: String(pageSize),
  }).toString(), [page, pageSize]);
  const { rows, total, loading, setRows } = useAdminList<AdminUser>(
    '/api/admin/users?' + params,
    data => ({ rows: data.users ?? [], total: data.pagination?.total ?? 0 }),
    message => toast.error(message)
  );

  const postUserAction = async (body: Record<string, unknown>) => {
    const res = await authFetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'User update failed');
    }
  };

  async function updateUser(id: string, body: Record<string, unknown>,
    mutate: (user: AdminUser) => AdminUser, success: string) {
    const previous = rows.find(row => row.id === id);
    setRows(list => list.map(user => user.id === id ? mutate(user) : user));
    try {
      await postUserAction({ ...body, userId: id });
      toast.success(success);
    } catch (error) {
      if (previous) setRows(list => list.map(user => user.id === id ? previous : user));
      toast.error(error instanceof Error ? error.message : 'User update failed');
    }
  }

  return <UserManagementView users={rows} total={total} page={page} pageSize={pageSize}
    onPageChange={setPage} onPageSizeChange={size => { setPage(0); setPageSize(size); }}
    isLoading={loading}
    onSuspendUser={id => void updateUser(id, { action: 'suspend' }, user => ({ ...user, isSuspended: true }), 'User suspended')}
    onUnsuspendUser={id => void updateUser(id, { action: 'unsuspend' }, user => ({ ...user, isSuspended: false }), 'User unsuspended')}
    onResetCredits={id => void updateUser(id, { action: 'reset_credits', credits: 0 },
      user => ({ ...user, fanProfile: user.fanProfile ? { ...user.fanProfile, remainingCredits: 0 } : undefined }), 'Credits reset')}
    onToggleExpertStatus={(id, current) => void updateUser(id, { action: 'set_expert_status', expertStatus: !current },
      user => ({ ...user, djProfile: { ...user.djProfile, expertStatus: !current } }), 'Expert status updated')}
    onSetReputation={(id, current) => {
      const value = window.prompt('Set reputation score (0–10):', String(current));
      if (value === null) return;
      const reputation = Number(value);
      if (!Number.isFinite(reputation) || reputation < 0 || reputation > 10) return void toast.error('Invalid reputation value');
      void updateUser(id, { action: 'set_reputation', reputation },
        user => ({ ...user, djProfile: { ...user.djProfile, reputationScore: reputation } }), 'Reputation updated');
    }}
  />;
}
