'use client';

import React, { useEffect, useState } from 'react';
import { UserManagementView } from './UserManagementView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function UserManagementContainer() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/admin/users?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch {
      toast.error('Network error loading users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const postUserAction = async (body: Record<string, unknown>) => {
    const res = await authFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('API Error');
    }
    return res.json();
  };

  const handleSuspendUser = async (userId: string) => {
    const previousUsers = [...users];
    setUsers(users.map(u => (u.id === userId ? { ...u, isSuspended: true } : u)));
    toast.success('User suspended');

    try {
      await postUserAction({ action: 'suspend', userId });
    } catch {
      toast.error('Failed to suspend user. Reverting.');
      setUsers(previousUsers);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    const previousUsers = [...users];
    setUsers(users.map(u => (u.id === userId ? { ...u, isSuspended: false } : u)));
    toast.success('User unsuspended');

    try {
      await postUserAction({ action: 'unsuspend', userId });
    } catch {
      toast.error('Failed to unsuspend user. Reverting.');
      setUsers(previousUsers);
    }
  };

  const handleResetCredits = async (userId: string) => {
    try {
      await postUserAction({ action: 'reset_credits', userId, credits: 0 });
      toast.success('Credits reset to 0');
      await fetchUsers();
    } catch {
      toast.error('Failed to reset credits');
    }
  };

  const handleToggleExpertStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const previousUsers = [...users];
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, djProfile: { ...u.djProfile, expertStatus: nextStatus } }
        : u
    ));

    try {
      await postUserAction({
        action: 'set_expert_status',
        userId,
        expertStatus: nextStatus,
      });
      toast.success(nextStatus ? 'Expert status granted' : 'Expert status revoked');
    } catch {
      toast.error('Failed to update expert status. Reverting.');
      setUsers(previousUsers);
    }
  };

  const handleSetReputation = async (userId: string, currentScore: number) => {
    const input = window.prompt('Set reputation score (0–10):', String(currentScore));
    if (input === null) return;

    const reputation = parseFloat(input);
    if (Number.isNaN(reputation) || reputation < 0) {
      toast.error('Invalid reputation value');
      return;
    }

    const previousUsers = [...users];
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, djProfile: { ...u.djProfile, reputationScore: reputation } }
        : u
    ));

    try {
      await postUserAction({ action: 'set_reputation', userId, reputation });
      toast.success('Reputation updated');
    } catch {
      toast.error('Failed to update reputation. Reverting.');
      setUsers(previousUsers);
    }
  };

  return (
    <UserManagementView
      users={users}
      isLoading={isLoading}
      onSuspendUser={handleSuspendUser}
      onUnsuspendUser={handleUnsuspendUser}
      onResetCredits={handleResetCredits}
      onToggleExpertStatus={handleToggleExpertStatus}
      onSetReputation={handleSetReputation}
    />
  );
}