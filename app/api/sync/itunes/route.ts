import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { applyCorsToResponse, handleCors } from '@/lib/api-middleware';
import { isCronRequest } from '@/lib/cronAuth';
import { isSupabaseServiceConfigured } from '@/lib/supabase/isConfigured';
import { processItunesSyncQueue } from '@/lib/sync/itunesSyncProcessor';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

function canRunItunesSync(req: NextRequest): boolean {
  if (isCronRequest(req)) return true;
  if (!isSupabaseServiceConfigured()) return true;
  return process.env.NODE_ENV !== 'production';
}

async function handleProcess(req: NextRequest) {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  if (!canRunItunesSync(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const force = req.headers.get('x-force-sync') === '1';
  const result = await processItunesSyncQueue({
    timeBudgetMs: force ? 120_000 : undefined,
  });

  logger.info('iTunes consolidated artist sync', result);

  const response = NextResponse.json({
    success: true,
    message: 'iTunes sync batch processed',
    ...result,
  });

  return applyCorsToResponse(response, 'POST,GET,OPTIONS');
}

/** Process queued iTunes artist sync jobs within a time budget (darktunes-style). */
export const POST = withErrorHandler(async (req: NextRequest) => handleProcess(req));

export const GET = withErrorHandler(async (req: NextRequest) => {
  if (!isCronRequest(req) && !canRunItunesSync(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return handleProcess(req);
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});