import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { applyCorsToResponse, handleCors } from '@/lib/api-middleware';
import { isCronRequest } from '@/lib/cronAuth';
import { requireAdmin } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseServiceConfigured } from '@/lib/supabase/isConfigured';
import { processSyncQueue } from '@/lib/sync/processSyncQueue';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

async function authorize(req: NextRequest): Promise<boolean> {
  if (isCronRequest(req)) return true;
  try {
    await requireAdmin(req);
    return true;
  } catch {
    return process.env.NODE_ENV !== 'production' && !isSupabaseServiceConfigured();
  }
}

async function handleProcess(req: NextRequest) {
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

  const force = req.headers.get('x-force-sync') === '1';
  const db = createServiceRoleSupabaseClient();
  const result = await processSyncQueue(db, {
    timeBudgetMs: force ? 120_000 : undefined,
  });

  logger.info('Durable sync queue processed', result);

  const response = NextResponse.json({
    success: true,
    message: 'Sync queue batch processed',
    ...result,
  });

  return applyCorsToResponse(response, 'POST,GET,OPTIONS');
}

/** Drain durable sync_queue (cron or admin). */
export const POST = withErrorHandler(async (req: NextRequest) => handleProcess(req));
export const GET = withErrorHandler(async (req: NextRequest) => handleProcess(req));

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
