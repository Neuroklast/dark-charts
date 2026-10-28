import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { enqueueArtistSyncJobs } from '@/lib/api/syncQueue';
import { ApiError } from '@/lib/errors';

const actionSchema = z.object({
  entity: z.enum(['artists', 'releases']),
  id: z.string().uuid(),
  action: z.enum(['approve', 'hide', 'reject', 'sync']),
});

export const GET = withAdminAuth(async (req: NextRequest) => {
  const entity = req.nextUrl.searchParams.get('entity') === 'releases' ? 'releases' : 'artists';
  const pendingOnly = req.nextUrl.searchParams.get('filter') !== 'all';
  const db = createServiceRoleSupabaseClient();

  if (entity === 'artists') {
    let q = db.from('artists')
      .select('id,name,genres,status,isVisible,source,spotifyId,itunesId,createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false }).limit(100);
    if (pendingOnly) q = q.eq('isVisible', false).eq('status', 'pending_review');
    const { data, error, count } = await q;
    if (error) throw new ApiError(500, 'Unable to load artist moderation queue');
    return NextResponse.json({ entity, items: data ?? [], count: count ?? 0 });
  }

  let q = db.from('releases')
    .select('id,title,releaseDate,isVisible,source,itunesId,artistId,artist:artists(id,name,isVisible)', { count: 'exact' })
    .order('createdAt', { ascending: false }).limit(100);
  if (pendingOnly) q = q.eq('isVisible', false);
  const { data, error, count } = await q;
  if (error) throw new ApiError(500, 'Unable to load release moderation queue');
  return NextResponse.json({ entity, items: data ?? [], count: count ?? 0 });
});

export const POST = withAdminAuth(async (req: NextRequest, adminId: string) => {
  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(400, 'Invalid moderation action');
  const { entity, id, action } = parsed.data;
  const db = createServiceRoleSupabaseClient();
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
