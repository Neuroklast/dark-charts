import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { seedConsolidatedArtists } from '@/lib/catalog/seedConsolidatedArtists';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/seed/artists
 * Seeds artists from consolidated_darkcharts_artists.csv and optionally enqueues sync.
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  let enqueueSync = false;
  let offset = 0;
  let limit = 25;
  try {
    const body = await req.json();
    if (Number.isInteger(body?.offset) && body.offset >= 0) offset = Math.min(body.offset, 10000);
    if (Number.isInteger(body?.limit) && body.limit > 0) limit = Math.min(body.limit, 50);
    if (typeof body?.enqueueSync === 'boolean') {
      enqueueSync = body.enqueueSync;
    }
  } catch {
    // empty body ok
  }

  const db = createServiceRoleSupabaseClient();
  const result = await seedConsolidatedArtists(db, { enqueueSync, offset, limit });

  logger.info('CSV artist seed completed', result);

  return NextResponse.json({
    success: true,
    ...result,
    offset,
    limit,
    nextOffset: offset + limit,
  });
});
