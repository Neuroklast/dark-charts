import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { getStartOfWeek } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getBlockedReleaseIdsForVoting } from '@/lib/vote-anomaly-guard';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 120 });
  if (rateLimited) return rateLimited;

  const supabase = createServiceRoleSupabaseClient();
  const weekStart = getStartOfWeek();
  const blocked = await getBlockedReleaseIdsForVoting(supabase, weekStart.toISOString());

  const response = NextResponse.json({
    success: true,
    weekStart: weekStart.toISOString(),
    blockedReleaseIds: [...blocked],
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});