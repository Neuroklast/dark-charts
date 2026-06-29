'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import {
  BadgeManagementView,
  type BadgeAssignmentRow,
  type BadgeDefinitionRow,
} from './BadgeManagementView';

export function BadgeManagementContainer() {
  const [badges, setBadges] = useState<BadgeDefinitionRow[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<BadgeAssignmentRow[]>([]);
  const [awardEmail, setAwardEmail] = useState('');
  const [awardBadgeId, setAwardBadgeId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/badges');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBadges(data.badges ?? []);
      setRecentAssignments(data.recentAssignments ?? []);
    } catch {
      toast.error('Failed to load badges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const postAction = async (body: Record<string, unknown>) => {
    const res = await authFetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Request failed');
    }
  };

  const handleAward = async () => {
    try {
      await postAction({ action: 'award_badge', email: awardEmail, badgeId: awardBadgeId });
      toast.success('Badge awarded');
      setAwardEmail('');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to award badge');
    }
  };

  const handleRevoke = async (email: string, badgeId: string) => {
    if (!window.confirm(`Revoke badge "${badgeId}" from ${email}?`)) return;
    try {
      await postAction({ action: 'revoke_badge', email, badgeId });
      toast.success('Badge revoked');
      await load();
    } catch {
      toast.error('Failed to revoke badge');
    }
  };

  return (
    <BadgeManagementView
      badges={badges}
      recentAssignments={recentAssignments}
      awardEmail={awardEmail}
      awardBadgeId={awardBadgeId}
      isLoading={isLoading}
      onAwardEmailChange={setAwardEmail}
      onAwardBadgeIdChange={setAwardBadgeId}
      onAward={handleAward}
      onRevoke={handleRevoke}
    />
  );
}