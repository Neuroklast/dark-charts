import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { applyCorsToResponse, handleCors } from '@/lib/api-middleware';
import { isCronRequest } from '@/lib/cronAuth';
import { requireAdmin } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseServiceConfigured } from '@/lib/supabase/isConfigured';
import {
  enqueueAllVisibleArtists,
  enqueueArtistSyncJobs,
  getSyncQueueStats,
} from '@/lib/api/syncQueue';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

async function authorize(req: NextRequest): Promise<boolean> {
  if (isCronRequest(req)) return true;
  try {
    await requireAdmin(req);
    return true;
  } catch {
    return process.env.NODE_ENV !== 'production' && !isSupabaseServiceConfigured();
  }
}

async function handleEnqueue(req: NextRequest) {
  const cors = handleCors(req, 'POST,GET,OPTIONS');
  if (cors) return cors;

  if (!(await authorize(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase is not configured' },
      { status: 503 }
    );
  }

  const db = createServiceRoleSupabaseClient();

  let artistIds: string[] | null = null;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (Array.isArray(body?.artistIds) && body.artistIds.every((id: unknown) => typeof id === 'string')) {
        artistIds = body.artistIds;
      }
    } catch {
      // empty body = enqueue all
    }
  }

  const result =
    artistIds && artistIds.length > 0
      ? {
          queued: await enqueueArtistSyncJobs(db, artistIds, 'full'),
          total: artistIds.length,
        }
      : await enqueueAllVisibleArtists(db, 'full');

  const queue = await getSyncQueueStats(db);
  logger.info('Sync jobs enqueued', result);

  const response = NextResponse.json({
    success: true,
    message: 'Artist sync jobs enqueued',
    queued: result.queued,
    totalArtists: result.total,
    queue,
  });

  return applyCorsToResponse(response, 'POST,GET,OPTIONS');
}

/** Enqueue sync jobs for all visible artists (or provided artistIds). */
export const POST = withErrorHandler(async (req: NextRequest) => handleEnqueue(req));
export const GET = withErrorHandler(async (req: NextRequest) => handleEnqueue(req));

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
