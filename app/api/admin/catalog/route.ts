import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { enqueueArtistSyncJobs } from '@/lib/api/syncQueue';
import { ApiError } from '@/lib/errors';

const singleActionSchema = z.object({
  entity: z.enum(['artists', 'releases']),
  id: z.string().uuid(),
  action: z.enum(['approve', 'hide', 'reject', 'sync']),
});

const bulkSchema = z.object({
  action: z.literal('bulk'),
  entity: z.enum(['artists', 'releases']),
  operation: z.enum(['approve', 'hide']),
  ids: z.array(z.string().uuid()).max(1000).optional(),
  allMatching: z.boolean().optional(),
  filter: z.enum(['pending', 'all']).optional(),
  visibility: z.enum(['all', 'pending', 'visible', 'hidden']).optional(),
  search: z.string().trim().max(100).optional(),
}).refine(value => value.allMatching || (value.ids?.length ?? 0) > 0, 'No records selected');

const actionSchema = z.union([singleActionSchema, bulkSchema]);
const BULK_MAX = 1000;

async function moderateBulk(db: ReturnType<typeof createServiceRoleSupabaseClient>,
  adminId: string, body: z.infer<typeof bulkSchema>) {
  let ids = [...new Set(body.ids ?? [])];
  const entity = body.entity;
  if (body.allMatching) {
    let query = entity === 'artists'
      ? db.from('artists').select('id', { count: 'exact' }).order('id', { ascending: true }).limit(BULK_MAX)
      : db.from('releases').select('id', { count: 'exact' }).order('id', { ascending: true }).limit(BULK_MAX);
    if (body.visibility === 'visible') query = query.eq('isVisible', true);
    if (body.visibility === 'hidden') query = query.eq('isVisible', false);
    if (body.visibility === 'pending' || (!body.visibility && body.filter === 'pending')) {
      if (entity === 'artists') {
        query = query.eq('isVisible', false).eq('status', 'pending_review');
      } else query = query.eq('isVisible', false);
    }
    const search = (body.search ?? '').replace(/[%_\\]/g, match => '\\' + match);
    if (search) query = query.ilike(entity === 'artists' ? 'name' : 'title', `%${search}%`);
    const { data, count, error } = await query;
    if (error) throw new ApiError(500, 'Unable to select matching records');
    if ((count ?? 0) > BULK_MAX)
      throw new ApiError(413, 'Too many matches. Narrow the filter (maximum 1000 per action).');
    ids = (data ?? []).map(row => row.id);
  }
  if (ids.length === 0) return NextResponse.json({ success: true, affected: 0, skipped: 0, jobsQueued: 0 });
  if (ids.length > BULK_MAX) throw new ApiError(413, 'Too many selected records');

  // Snapshot selected IDs, then return immediately. The cron worker processes
  // each 50-row batch atomically in Postgres with a progress record and audit log.
  const { data: job, error } = await db.from('admin_bulk_jobs').insert({
    adminId, entity, operation: body.operation, targetIds: ids,
    total: ids.length, status: 'queued',
  }).select('id,total,status').single();
  if (error) throw new ApiError(503, 'Unable to enqueue bulk action: ' + error.message);
  return NextResponse.json({ queued: true, jobId: job.id, total: job.total, status: job.status },
    { status: 202 });
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  const entity = req.nextUrl.searchParams.get('entity') === 'releases' ? 'releases' : 'artists';
  const pendingOnly = req.nextUrl.searchParams.get('filter') !== 'all';
  const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('limit')) || 25));
  const page = Math.min(10000, Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0));
  const search = (req.nextUrl.searchParams.get('search') ?? '').trim().slice(0, 100)
    .replace(/[%_\\]/g, '\\$&');
  const db = createServiceRoleSupabaseClient();
  if (entity === 'artists') {
    let q = db.from('artists')
      .select('id,name,genres,status,isVisible,source,spotifyId,itunesId,createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false }).order('id', { ascending: true })
      .range(page * limit, page * limit + limit - 1);
    if (pendingOnly) q = q.eq('isVisible', false).eq('status', 'pending_review');
    if (search) q = q.ilike('name', `%${search}%`);
    const { data, error, count } = await q;
    if (error) throw new ApiError(500, 'Unable to load artist moderation queue');
    return NextResponse.json({ entity, items: data ?? [], count: count ?? 0, page, limit });
  }
  let q = db.from('releases')
    .select('id,title,releaseDate,isVisible,source,itunesId,artistId,artist:artists(id,name,isVisible)', { count: 'exact' })
    .order('createdAt', { ascending: false }).order('id', { ascending: true })
    .range(page * limit, page * limit + limit - 1);
  if (pendingOnly) q = q.eq('isVisible', false);
  if (search) q = q.ilike('title', `%${search}%`);
  const { data, error, count } = await q;
  if (error) throw new ApiError(500, 'Unable to load release moderation queue');
  return NextResponse.json({ entity, items: data ?? [], count: count ?? 0, page, limit });
});

export const POST = withAdminAuth(async (req: NextRequest, adminId: string) => {
  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(400, 'Invalid moderation action');
  const body = parsed.data;
  const db = createServiceRoleSupabaseClient();
  if (body.action === 'bulk') return moderateBulk(db, adminId, body);
  const { entity, id, action } = body;
  let jobsQueued = 0;

  if (entity === 'artists') {
    const { data: artist, error: lookupError } = await db.from('artists')
      .select('id,isVisible,status').eq('id', id).maybeSingle();
    if (lookupError) throw new ApiError(500, 'Could not load artist');
    if (!artist) throw new ApiError(404, 'Artist not found');

    if (action === 'sync') {
      if (!artist.isVisible || artist.status !== 'active')
        throw new ApiError(409, 'Approve this artist before synchronization');
      jobsQueued = await enqueueArtistSyncJobs(db, [id], 'full');
    } else if (action === 'approve') {
      const { error } = await db.from('artists')
        .update({ isVisible: true, status: 'active', updatedAt: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new ApiError(500, 'Artist approval failed');
      jobsQueued = await enqueueArtistSyncJobs(db, [id], 'full');
    } else {
      // Disabling the artist must also hide its releases to avoid orphaned public content.
      const { error: hideError } = await db.from('releases')
        .update({ isVisible: false, updatedAt: new Date().toISOString() })
        .eq('artistId', id);
      if (hideError) throw new ApiError(500, 'Could not hide artist releases');
      const { error } = await db.from('artists')
        .update({ isVisible: false, status: action === 'reject' ? 'rejected' : 'inactive', updatedAt: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new ApiError(500, 'Artist moderation failed');
    }
  } else {
    if (action === 'sync') throw new ApiError(400, 'Sync can only be requested for artists');
    const { data: release, error: lookupError } = await db.from('releases')
      .select('id,artistId').eq('id', id).maybeSingle();
    if (lookupError) throw new ApiError(500, 'Could not load release');
    if (!release) throw new ApiError(404, 'Release not found');

    if (action === 'approve') {
      const { data: artist } = await db.from('artists')
        .select('id,isVisible,status').eq('id', release.artistId).maybeSingle();
      if (!artist?.isVisible || artist.status !== 'active')
        throw new ApiError(409, 'Artist must be approved first');
    }
    const { error } = await db.from('releases')
      .update({
        isVisible: action === 'approve',
        ...(action === 'reject' ? { syncPolicy: 'manual' } : {}),
        updatedAt: new Date().toISOString(),
      }).eq('id', id);
    if (error) throw new ApiError(500, 'Release moderation failed');
  }

  const { error: auditError } = await db.from('audit_logs').insert({
    adminId, action: 'CATALOG_' + action.toUpperCase(), details: { entity, id, jobsQueued },
  });
  if (auditError) throw new ApiError(500, 'Moderation succeeded but audit log failed');
  return NextResponse.json({ success: true, entity, id, action, jobsQueued });
});
