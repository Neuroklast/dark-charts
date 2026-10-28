import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

interface FanProfileRow {
  id: string;
  remainingCredits: number;
}

/**
 * Cast an entire ballot in one PostgreSQL transaction. The server calls this
 * using the service-role client after authentication and eligibility checks.
 * PostgreSQL locks the fan profile and enforces the budget and weekly limit.
 */
export async function submitFanBulkVotes(params: {
  supabase: SupabaseClient;
  fanProfile: FanProfileRow;
  votes: Record<string, number>;
  creditBudget: number;
  weekStart: Date;
}): Promise<{ votes: unknown[]; remainingCredits: number }> {
  const { supabase, fanProfile, votes, creditBudget, weekStart } = params;

  const { data, error } = await supabase.rpc('cast_weekly_ballot', {
    p_fan_id: fanProfile.id,
    p_week_start: weekStart.toISOString(),
    p_credit_budget: creditBudget,
    p_votes: votes,
  });

  if (error) {
    const reason = error.message;
    if (reason.includes('ALREADY_VOTED') || error.code === '23505') {
      throw new ApiError(409, 'You have already submitted your vote this week', 'ALREADY_VOTED');
    }
    if (reason.includes('RELEASE_NOT_ELIGIBLE')) {
      throw new ApiError(400, 'Release is not eligible for voting', 'RELEASE_NOT_ELIGIBLE');
    }
    if (reason.includes('INSUFFICIENT_CREDITS')) {
      throw new ApiError(400, 'Insufficient voice credits', 'INSUFFICIENT_CREDITS');
    }
    if (error.code === '22023') {
      throw new ApiError(400, 'Invalid ballot', 'INVALID_BALLOT');
    }
    throw new ApiError(500, 'Could not save ballot atomically', 'BALLOT_SAVE_FAILED');
  }

  if (!data || !Array.isArray(data.votes) ||
      !Number.isInteger(data.remainingCredits) || data.remainingCredits < 0) {
    throw new ApiError(500, 'Unexpected ballot result', 'BALLOT_SAVE_FAILED');
  }

  return { votes: data.votes, remainingCredits: data.remainingCredits };
}
