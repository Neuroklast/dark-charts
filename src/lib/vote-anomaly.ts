import type { SupabaseClient } from '@supabase/supabase-js';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface VoteAnomalyInsert {
  weekStart: string;
  anomalyType: string;
  severity: AnomalySeverity;
  releaseId?: string;
  details: Record<string, unknown>;
}

interface FanVoteRow {
  fanId: string;
  releaseId: string;
  cost: number;
  createdAt: string;
}

interface FanProfileRow {
  id: string;
  userId: string;
}

interface UserRow {
  id: string;
  trustLevel: number;
  createdAt: string;
}

const LOW_TRUST_THRESHOLD = 0.8;
const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function detectVoteAnomalies(params: {
  weekStartIso: string;
  votes: FanVoteRow[];
  fanProfiles: FanProfileRow[];
  users: UserRow[];
}): VoteAnomalyInsert[] {
  const { weekStartIso, votes, fanProfiles, users } = params;
  const anomalies: VoteAnomalyInsert[] = [];

  const fanToUser = new Map(fanProfiles.map((p) => [p.id, p.userId]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const weekStartMs = new Date(weekStartIso).getTime();

  const votesByRelease = new Map<string, FanVoteRow[]>();
  for (const vote of votes) {
    const list = votesByRelease.get(vote.releaseId) ?? [];
    list.push(vote);
    votesByRelease.set(vote.releaseId, list);
  }

  for (const [releaseId, releaseVotes] of votesByRelease) {
    if (releaseVotes.length < 5) continue;

    let lowTrustVotes = 0;
    let newAccountVotes = 0;

    for (const vote of releaseVotes) {
      const userId = fanToUser.get(vote.fanId);
      if (!userId) continue;
      const user = userById.get(userId);
      if (!user) continue;

      if ((user.trustLevel ?? 0) < 1) {
        lowTrustVotes += 1;
      }

      const accountAge = weekStartMs - new Date(user.createdAt).getTime();
      if (accountAge >= 0 && accountAge <= NEW_ACCOUNT_WINDOW_MS) {
        newAccountVotes += 1;
      }
    }

    const lowTrustRatio = lowTrustVotes / releaseVotes.length;
    if (lowTrustRatio >= LOW_TRUST_THRESHOLD) {
      anomalies.push({
        weekStart: weekStartIso,
        anomalyType: 'LOW_TRUST_CLUSTER',
        severity: lowTrustRatio >= 0.95 ? 'high' : 'medium',
        releaseId,
        details: {
          totalVotes: releaseVotes.length,
          lowTrustVotes,
          ratio: Number(lowTrustRatio.toFixed(3)),
        },
      });
    }

    const newAccountRatio = newAccountVotes / releaseVotes.length;
    if (newAccountRatio >= 0.6 && releaseVotes.length >= 10) {
      anomalies.push({
        weekStart: weekStartIso,
        anomalyType: 'NEW_ACCOUNT_SURGE',
        severity: newAccountRatio >= 0.85 ? 'high' : 'medium',
        releaseId,
        details: {
          totalVotes: releaseVotes.length,
          newAccountVotes,
          ratio: Number(newAccountRatio.toFixed(3)),
        },
      });
    }
  }

  return anomalies;
}

export async function persistVoteAnomalies(
  supabase: SupabaseClient,
  weekStartIso: string,
  anomalies: VoteAnomalyInsert[]
): Promise<void> {
  await supabase.from('vote_anomalies').delete().eq('weekStart', weekStartIso);

  if (anomalies.length === 0) return;

  const { error } = await supabase.from('vote_anomalies').insert(anomalies);
  if (error) {
    throw new Error(`Failed to persist vote anomalies: ${error.message}`);
  }
}