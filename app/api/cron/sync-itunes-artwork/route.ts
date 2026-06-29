import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { syncArtworkBatch } from '@/lib/sync/itunesArtworkSync';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

/** Vercel Cron: cache missing iTunes cover art to R2 (batch of 30). */
export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  const supabase = createServiceRoleSupabaseClient();
  const result = await syncArtworkBatch(supabase, {
    onlyMissing: true,
    limit: 30,
    offset: 0,
    force: false,
  });

  logger.info('Cron iTunes artwork sync', {
    synced: result.synced,
    processed: result.processed,
    notFound: result.notFound,
    errors: result.errors,
  });

  return NextResponse.json({
    success: true,
    message: 'iTunes artwork cron sync completed',
    ...result,
  });
});