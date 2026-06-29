import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

/**
 * Returns artist IDs the user controls via a band profile.
 */
export async function getOwnedArtistIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('band_profiles')
    .select('artistId')
    .eq('userId', userId);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return (data ?? []).map((row) => row.artistId).filter(Boolean);
}

/**
 * Blocks voting on releases owned by the voter (band/DJ conflict of interest).
 */
export async function assertNoVoteConflicts(
  supabase: SupabaseClient,
  userId: string,
  releaseIds: string[]
): Promise<void> {
  if (releaseIds.length === 0) return;

  const ownedArtistIds = await getOwnedArtistIds(supabase, userId);
  if (ownedArtistIds.length === 0) return;

  const { data: releases, error } = await supabase
    .from('releases')
    .select('id, artistId, title')
    .in('id', releaseIds);

  if (error) {
    throw new ApiError(500, error.message);
  }

  const ownedSet = new Set(ownedArtistIds);
  const conflict = (releases ?? []).find((r) => ownedSet.has(r.artistId));

  if (conflict) {
    throw new ApiError(
      403,
      'You cannot vote for your own releases',
      'VOTE_CONFLICT_OF_INTEREST'
    );
  }
}