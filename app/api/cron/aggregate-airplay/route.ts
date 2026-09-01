import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { rollupAirplayWeek } from '@/lib/airplay/airplayRepository';
import { logger } from '@/lib/logger';
import { getWeekStartMonday, getPreviousWeekStart } from '@/lib/week';

// Runs shortly before aggregate-charts so airplay_snapshots exist when the
// weekly chart aggregation reads them.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new ApiError(401, 'Unauthorized');
  }

  const weekStart = getWeekStartMonday();
  const previousWeekStart = getPreviousWeekStart(weekStart);
  const db = createServiceRoleSupabaseClient();

  const result = await rollupAirplayWeek(
    db,
    weekStart.toISOString(),
    previousWeekStart.toISOString()
  );

  logger.info('Airplay snapshots rolled up successfully', result);

  return NextResponse.json({ success: true, ...result });
});
