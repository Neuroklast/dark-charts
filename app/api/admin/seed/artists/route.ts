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
  let enqueueSync = true;
  try {
    const body = await req.json();
    if (typeof body?.enqueueSync === 'boolean') {
      enqueueSync = body.enqueueSync;
    }
  } catch {
    // empty body ok
  }

  const db = createServiceRoleSupabaseClient();
  const result = await seedConsolidatedArtists(db, { enqueueSync });

  logger.info('CSV artist seed completed', result);

  return NextResponse.json({
    success: true,
    ...result,
  });
});
