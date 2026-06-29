import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireAdmin } from '@/lib/adminAuth';
import { isCronRequest } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { syncArtworkBatch } from '@/lib/sync/itunesArtworkSync';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

const bodySchema = z.object({
  releaseId: z.string().uuid().optional(),
  artistId: z.string().uuid().optional(),
  force: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  onlyMissing: z.boolean().optional().default(true),
});

async function requireAdminOrCron(req: NextRequest): Promise<string | null> {
  if (isCronRequest(req)) return null;
  return requireAdmin(req);
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const adminId = await requireAdminOrCron(req);

  const raw = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid request body', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await syncArtworkBatch(supabase, parsed.data);

  logger.info('iTunes artwork sync completed', {
    adminId,
    ...result,
    resultCount: result.results.length,
  });

  const response = NextResponse.json({
    success: true,
    message: 'iTunes artwork sync completed',
    ...result,
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 10,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});