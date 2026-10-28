import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
type JobContext = { params: Promise<{ jobId: string }> };

export const GET = withAdminAuth(async (_req: NextRequest, adminId: string, context?: JobContext) => {
  const id = (await context?.params)?.jobId;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(400, 'Invalid job ID');
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db.from('admin_bulk_jobs')
    .select('id,entity,operation,total,processed,affected,skipped,status,error,createdAt,finishedAt')
    .eq('id', id).eq('adminId', adminId).maybeSingle();
  if (error) throw new ApiError(500, 'Could not read job progress');
  if (!data) throw new ApiError(404, 'Job not found');
  return NextResponse.json({ job: data }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = withAdminAuth(async (req: NextRequest, adminId: string, context?: JobContext) => {
  const id = (await context?.params)?.jobId;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(400, 'Invalid job ID');
  const { action } = await req.json().catch(() => ({}));
  if (action !== 'retry') throw new ApiError(400, 'Unsupported job action');
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db.from('admin_bulk_jobs')
    .update({ status: 'queued', error: null, updatedAt: new Date().toISOString() })
    .eq('id', id).eq('adminId', adminId).eq('status', 'failed')
    .select('id,status').maybeSingle();
  if (error) throw new ApiError(500, 'Job retry failed');
  if (!data) throw new ApiError(409, 'Job is not failed or does not exist');
  return NextResponse.json({ job: data });
});
