import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const { userId } = decoded;
  const supabase = createServiceRoleSupabaseClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role, createdAt, updatedAt, isSuspended')
    .eq('id', userId)
    .maybeSingle();

  if (userError) throw new ApiError(500, userError.message);
  if (!user) throw new ApiError(404, 'User not found');

  const [
    fanProfileResult,
    djProfileResult,
    bandProfileResult,
    labelProfileResult,
    badgesResult,
    bookingsResult,
  ] = await Promise.all([
    supabase.from('fan_profiles').select('*').eq('userId', userId).maybeSingle(),
    supabase.from('dj_profiles').select('*').eq('userId', userId).maybeSingle(),
    supabase.from('band_profiles').select('*').eq('userId', userId).maybeSingle(),
    supabase.from('label_profiles').select('*').eq('userId', userId).maybeSingle(),
    supabase
      .from('user_badges')
      .select('earnedAt, badge:badges(id, name, description, iconUrl)')
      .eq('userId', userId),
    supabase.from('bookings').select('*').eq('userId', userId),
  ]);

  const fanProfile = fanProfileResult.data;
  const djProfile = djProfileResult.data;

  let fanVotes: unknown[] = [];
  if (fanProfile?.id) {
    const { data, error } = await supabase
      .from('votes')
      .select('id, releaseId, allocatedVotes, cost, credits, votes, createdAt')
      .eq('fanId', fanProfile.id);
    if (error) throw new ApiError(500, error.message);
    fanVotes = data ?? [];
  }

  let expertVotes: unknown[] = [];
  if (djProfile?.id) {
    const { data, error } = await supabase
      .from('expert_votes')
      .select('id, releaseId, rank, rating, createdAt')
      .eq('djId', djProfile.id);
    if (error) throw new ApiError(500, error.message);
    expertVotes = data ?? [];
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user,
    profiles: {
      fan: fanProfile,
      dj: djProfile,
      band: bandProfileResult.data,
      label: labelProfileResult.data,
    },
    votes: fanVotes,
    expertVotes,
    badges: badgesResult.data ?? [],
    bookings: bookingsResult.data ?? [],
  };

  const filename = `dark-charts-export-${userId.slice(0, 8)}.json`;

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});