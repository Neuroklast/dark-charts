import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getIsVotingPaused, setIsVotingPaused } from '@/lib/system-settings';
import { ApiError } from '@/lib/errors';
import { chartAggregationService } from '@/backend/services/ChartAggregationService';
import { getPreviousWeekStart, getWeekStartMonday } from '@/lib/week';

export const GET = withAdminAuth(async (_req, _adminId) => {
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: recentCharts, error }, isVotingPaused] = await Promise.all([
    supabase
      .from('chart_entries')
      .select('*, release:releases(*, artist:artists(*))')
      .order('createdAt', { ascending: false })
      .limit(20),
    getIsVotingPaused(supabase),
  ]);

  if (error) throw new ApiError(500, error.message);

  return NextResponse.json({ charts: recentCharts ?? [], isVotingPaused });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action } = body ?? {};
  const supabase = createServiceRoleSupabaseClient();

  if (action === 'toggle_pause') {
    const current = await getIsVotingPaused(supabase);
    const isVotingPaused = !current;
    await setIsVotingPaused(supabase, isVotingPaused);

    await supabase.from('audit_logs').insert({
      adminId,
      action: isVotingPaused ? 'VOTING_PAUSED' : 'VOTING_RESUMED',
      details: {},
    });

    return NextResponse.json({ success: true, isVotingPaused });
  }

  if (action === 'recalculate_week') {
    const weekStart = body.weekStart
      ? new Date(body.weekStart)
      : getPreviousWeekStart(getWeekStartMonday());

    await chartAggregationService.aggregateChartsForWeek(weekStart);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'RECALCULATE_CHARTS',
      details: { weekStart: weekStart.toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Charts recalculated',
      weekStart: weekStart.toISOString(),
    });
  }

  throw new ApiError(400, 'Invalid action');
});