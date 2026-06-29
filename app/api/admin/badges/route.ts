import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { BADGE_DEFINITIONS } from '@/backend/services/BadgeDefinitions';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();

  const [assignmentsResult, countsResult] = await Promise.all([
    supabase
      .from('user_badges')
      .select('*, user:users(email)')
      .order('earnedAt', { ascending: false })
      .limit(50),
    supabase.from('user_badges').select('badgeId'),
  ]);

  if (assignmentsResult.error) throw new ApiError(500, assignmentsResult.error.message);
  if (countsResult.error) throw new ApiError(500, countsResult.error.message);

  const earnedCounts: Record<string, number> = {};
  for (const row of countsResult.data ?? []) {
    earnedCounts[row.badgeId] = (earnedCounts[row.badgeId] ?? 0) + 1;
  }

  const badges = BADGE_DEFINITIONS.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    category: badge.category,
    earnedCount: earnedCounts[badge.id] ?? 0,
  }));

  const recentAssignments = (assignmentsResult.data ?? []).map((row) => ({
    id: row.id,
    badgeId: row.badgeId,
    userEmail: row.user?.email ?? null,
    earnedAt: row.earnedAt,
  }));

  return NextResponse.json({ badges, recentAssignments });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action, email, badgeId } = body ?? {};
  if (!action) throw new ApiError(400, 'Action is required');

  const supabase = createServiceRoleSupabaseClient();
  const definition = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!definition) throw new ApiError(400, 'Unknown badge');

  if (!email || typeof email !== 'string') {
    throw new ApiError(400, 'User email is required');
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (userError) throw new ApiError(500, userError.message);
  if (!user) throw new ApiError(404, 'User not found');

  if (action === 'award_badge') {
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('userId', user.id)
      .eq('badgeId', badgeId)
      .maybeSingle();

    if (existing) throw new ApiError(409, 'User already has this badge');

    const { data: created, error } = await supabase
      .from('user_badges')
      .insert({
        userId: user.id,
        badgeId,
        earnedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'BADGE_AWARD',
      details: { userId: user.id, badgeId, email: user.email },
    });

    return NextResponse.json({ success: true, assignment: created });
  }

  if (action === 'revoke_badge') {
    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('userId', user.id)
      .eq('badgeId', badgeId);

    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'BADGE_REVOKE',
      details: { userId: user.id, badgeId, email: user.email },
    });

    return NextResponse.json({ success: true });
  }

  throw new ApiError(400, 'Invalid action');
});