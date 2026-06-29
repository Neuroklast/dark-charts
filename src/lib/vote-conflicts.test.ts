import { describe, it, expect, vi } from 'vitest';
import { assertNoVoteConflicts, getOwnedArtistIds } from './vote-conflicts';
import { ApiError } from '@/lib/errors';

function createMockSupabase(handlers: {
  bandProfiles?: { artistId: string }[];
  releases?: { id: string; artistId: string; title: string }[];
  bandError?: string;
  releaseError?: string;
}) {
  return {
    from: (table: string) => {
      if (table === 'band_profiles') {
        return {
          select: () => ({
            eq: async () => {
              if (handlers.bandError) {
                return { data: null, error: { message: handlers.bandError } };
              }
              return { data: handlers.bandProfiles ?? [], error: null };
            },
          }),
        };
      }
      if (table === 'releases') {
        return {
          select: () => ({
            in: async () => {
              if (handlers.releaseError) {
                return { data: null, error: { message: handlers.releaseError } };
              }
              return { data: handlers.releases ?? [], error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as any;
}

describe('vote-conflicts', () => {
  it('returns owned artist IDs from band profile', async () => {
    const supabase = createMockSupabase({
      bandProfiles: [{ artistId: 'artist-1' }],
    });

    const ids = await getOwnedArtistIds(supabase, 'user-1');
    expect(ids).toEqual(['artist-1']);
  });

  it('allows voting when user owns no artists', async () => {
    const supabase = createMockSupabase({
      bandProfiles: [],
      releases: [{ id: 'r1', artistId: 'artist-2', title: 'Track' }],
    });

    await expect(
      assertNoVoteConflicts(supabase, 'user-1', ['r1'])
    ).resolves.toBeUndefined();
  });

  it('blocks voting on own releases', async () => {
    const supabase = createMockSupabase({
      bandProfiles: [{ artistId: 'artist-1' }],
      releases: [{ id: 'r1', artistId: 'artist-1', title: 'Own Track' }],
    });

    await expect(
      assertNoVoteConflicts(supabase, 'user-1', ['r1'])
    ).rejects.toMatchObject({
      status: 403,
      code: 'VOTE_CONFLICT_OF_INTEREST',
    });
  });
});