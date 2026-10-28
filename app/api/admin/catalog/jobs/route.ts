import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (_req, adminId) => {
  const db = createServiceRoleSupabaseClient();
  const { data,error } = await db.from('admin_bulk_jobs')
    .select('id,entity,operation,total,processed,affected,skipped,status,error,createdAt,finishedAt')
    .eq('adminId',adminId).order('createdAt',{ ascending:false }).limit(10);
  if (error) throw new ApiError(503,'Job history unavailable');
  return NextResponse.json({ jobs:data ?? [] },{ headers:{ 'Cache-Control':'no-store' } });
});
