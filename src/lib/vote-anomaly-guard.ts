import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

export async function getBlockedReleaseIdsForVoting(
  supabase: SupabaseClient,
  weekStartIso: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('vote_anomalies')
    .select('releaseId')
    .eq('weekStart', weekStartIso)
    .eq('severity', 'high')
    .eq('resolved', false)
    .not('releaseId', 'is', null);

  if (error) {
    throw new ApiError(500, error.message);
  }

  const blocked = new Set<string>();
  for (const row of data ?? []) {
    if (row.releaseId) blocked.add(row.releaseId);
  }
  return blocked;
}

export async function assertReleasesNotVoteBlocked(
  supabase: SupabaseClient,
  releaseIds: string[],
  weekStartIso: string
): Promise<void> {
  if (releaseIds.length === 0) return;

  const blocked = await getBlockedReleaseIdsForVoting(supabase, weekStartIso);
  const hit = releaseIds.find((id) => blocked.has(id));
  if (hit) {
    throw new ApiError(
      403,
      'Voting on this release is temporarily suspended due to integrity review',
      'RELEASE_VOTE_SUSPENDED'
    );
  }
}