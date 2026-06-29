import { describe, it, expect } from 'vitest';
import { assertReleasesNotVoteBlocked, getBlockedReleaseIdsForVoting } from './vote-anomaly-guard';
import { ApiError } from '@/lib/errors';

function createMockSupabase(anomalies: { releaseId: string | null }[], error?: string) {
  return {
    from: (table: string) => {
      if (table !== 'vote_anomalies') throw new Error(`Unexpected table: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                not: async () => {
                  if (error) return { data: null, error: { message: error } };
                  return { data: anomalies, error: null };
                },
              }),
            }),
          }),
        }),
      };
    },
  } as any;
}

describe('vote-anomaly-guard', () => {
  it('returns blocked release ids for unresolved high-severity anomalies', async () => {
    const supabase = createMockSupabase([
      { releaseId: 'release-1' },
      { releaseId: 'release-2' },
    ]);

    const blocked = await getBlockedReleaseIdsForVoting(supabase, '2026-06-23T00:00:00.000Z');
    expect(blocked.has('release-1')).toBe(true);
    expect(blocked.has('release-2')).toBe(true);
    expect(blocked.size).toBe(2);
  });

  it('allows voting when release is not blocked', async () => {
    const supabase = createMockSupabase([{ releaseId: 'release-1' }]);

    await expect(
      assertReleasesNotVoteBlocked(supabase, ['release-9'], '2026-06-23T00:00:00.000Z')
    ).resolves.toBeUndefined();
  });

  it('blocks voting on releases under integrity review', async () => {
    const supabase = createMockSupabase([{ releaseId: 'release-1' }]);

    await expect(
      assertReleasesNotVoteBlocked(supabase, ['release-1'], '2026-06-23T00:00:00.000Z')
    ).rejects.toMatchObject({
      status: 403,
      code: 'RELEASE_VOTE_SUSPENDED',
    } satisfies Partial<ApiError>);
  });
});