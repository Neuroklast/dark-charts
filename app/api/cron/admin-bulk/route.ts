import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);
  const db = createServiceRoleSupabaseClient();
  let batches = 0;
  let failed = 0;
  // A bounded loop prevents long-running cron invocations. Each RPC is an
  // independent transaction, so a retry cannot repeat committed batches.
  for (let i = 0; i < 12; i++) {
    const { data, error } = await db.rpc('process_admin_bulk_job');
    if (error) throw new Error('Bulk worker unavailable: ' + error.message);
    if (!data?.worked) break;
    batches++;
    if (data.status === 'failed') failed++;
  }
  return NextResponse.json({ success: true, batches, failed }, {
    headers: { 'Cache-Control': 'no-store' },
  });
});
