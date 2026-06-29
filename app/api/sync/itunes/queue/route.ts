import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { applyCorsToResponse, handleCors } from '@/lib/api-middleware';
import { isCronRequest } from '@/lib/cronAuth';
import { isSupabaseServiceConfigured } from '@/lib/supabase/isConfigured';
import { enqueueConsolidatedArtistJobs, getItunesSyncQueueStats } from '@/lib/sync/itunesSyncQueue';
import { getItunesReleaseCount } from '@/lib/charts/itunesChartStore';

export const maxDuration = 60;

function canRunItunesSync(req: NextRequest): boolean {
  if (isCronRequest(req)) return true;
  if (!isSupabaseServiceConfigured()) return true;
  return process.env.NODE_ENV !== 'production';
}

async function handleEnqueue(req: NextRequest) {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  if (!canRunItunesSync(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const result = enqueueConsolidatedArtistJobs();

  const response = NextResponse.json({
    success: true,
    message: 'iTunes artist sync jobs enqueued',
    queued: result.queued,
    totalArtists: result.total,
    releasesCached: getItunesReleaseCount(),
    queue: getItunesSyncQueueStats(),
  });

  return applyCorsToResponse(response, 'POST,GET,OPTIONS');
}

/** Enqueue iTunes sync jobs for all consolidated Dark Charts artists. */
export const POST = withErrorHandler(async (req: NextRequest) => handleEnqueue(req));

export const GET = withErrorHandler(async (req: NextRequest) => {
  if (!isCronRequest(req) && !canRunItunesSync(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return handleEnqueue(req);
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});