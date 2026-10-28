import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import { submitFanBulkVotes } from './fan-vote';

const WEEK = new Date('2026-09-07T00:00:00.000Z');

function createClient(result: { data: unknown; error: { message: string; code?: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const supabase = { rpc } as unknown as SupabaseClient;
  return { supabase, rpc };
}

const params = {
  fanProfile: { id: 'fan-profile-1', remainingCredits: 150 },
  votes: { 'release-1': 2, 'release-2': 1 },
  creditBudget: 150,
  weekStart: WEEK,
};

describe('submitFanBulkVotes', () => {
  it('submits one atomic RPC for the whole weekly ballot', async () => {
    const created = [
      { releaseId: 'release-1', allocatedVotes: 2, cost: 4 },
      { releaseId: 'release-2', allocatedVotes: 1, cost: 1 },
    ];
    const { supabase, rpc } = createClient({
      data: { votes: created, remainingCredits: 145 },
      error: null,
    });
    const result = await submitFanBulkVotes({ supabase, ...params });

    expect(result).toEqual({ votes: created, remainingCredits: 145 });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('cast_weekly_ballot', {
      p_fan_id: 'fan-profile-1',
      p_week_start: WEEK.toISOString(),
      p_credit_budget: 150,
      p_votes: params.votes,
    });
  });

  it('returns a conflict when this account already voted this week', async () => {
    const { supabase } = createClient({
      data: null,
      error: { message: 'ALREADY_VOTED', code: '23505' },
    });
    await expect(submitFanBulkVotes({ supabase, ...params }))
      .rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_VOTED' });
  });

  it('rejects insufficient credits without making a partial write', async () => {
    const { supabase, rpc } = createClient({
      data: null,
      error: { message: 'INSUFFICIENT_CREDITS', code: '22023' },
    });
    await expect(submitFanBulkVotes({ supabase, ...params }))
      .rejects.toBeInstanceOf(ApiError);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed or empty RPC results', async () => {
    const { supabase } = createClient({ data: {}, error: null });
    await expect(submitFanBulkVotes({ supabase, ...params }))
      .rejects.toBeInstanceOf(ApiError);
  });
});
