import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { formatChartEntry } from '@/lib/chart-format';
import { getStartOfWeek } from '@/lib/api-auth';

const querySchema = z.object({
  type: z.enum(['fan', 'expert', 'streaming', 'combined']),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  completed: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 120 });
  if (rateLimited) return rateLimited;

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parseResult = querySchema.safeParse(params);
  if (!parseResult.success) {
    throw new ApiError(400, 'Invalid parameters', 'VALIDATION_ERROR');
  }

  const { type, limit: limitNum, completed } = parseResult.data;
  const supabase = createServiceRoleSupabaseClient();

  let targetWeekStart = getStartOfWeek();

  if (completed) {
    const { data: latestEntry } = await supabase
      .from('chart_entries')
      .select('weekStart')
      .eq('chartType', type)
      .order('weekStart', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEntry?.weekStart) {
      targetWeekStart = new Date(latestEntry.weekStart);
    } else {
      targetWeekStart.setDate(targetWeekStart.getDate() - 7);
    }
  }

  const { data: chartEntries, error } = await supabase
    .from('chart_entries')
    .select('*, release:releases(*, artist:artists(*))')
    .eq('chartType', type)
    .eq('weekStart', targetWeekStart.toISOString())
    .order('placement', { ascending: true })
    .limit(limitNum);

  if (error) {
    throw new ApiError(500, error.message);
  }

  const formattedEntries = (chartEntries ?? []).map((entry) => formatChartEntry(entry));
  const response = NextResponse.json({
    success: true,
    chartType: type,
    entries: formattedEntries,
    count: formattedEntries.length,
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});