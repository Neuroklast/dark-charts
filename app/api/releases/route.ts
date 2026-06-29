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

const querySchema = z.object({
  id: z.string().optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0)),
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

  const { id, limit: limitNum, offset: offsetNum } = parseResult.data;
  const supabase = createServiceRoleSupabaseClient();

  if (id) {
    const { data: release, error } = await supabase
      .from('releases')
      .select('*, artist:artists(*), chartEntries:chart_entries(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!release) throw new ApiError(404, 'Release not found');

    const response = NextResponse.json({ success: true, release });
    return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
      maxRequests: 120,
    });
  }

  const { data: releases, error: releasesError } = await supabase
    .from('releases')
    .select('*, artist:artists(*)')
    .eq('isVisible', true)
    .order('releaseDate', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  if (releasesError) throw new ApiError(500, releasesError.message);

  const { count, error: countError } = await supabase
    .from('releases')
    .select('*', { count: 'exact', head: true })
    .eq('isVisible', true);

  if (countError) throw new ApiError(500, countError.message);

  const total = count ?? 0;
  const response = NextResponse.json({
    success: true,
    releases: releases ?? [],
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});