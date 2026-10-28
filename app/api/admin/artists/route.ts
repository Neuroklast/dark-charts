import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import type { AppSupabaseClient } from '@/types/supabase-client';
import { ApiError } from '@/lib/errors';
import { enqueueAllVisibleArtists } from '@/lib/api/syncQueue';

const artistSchema = z.object({
  name: z.string().trim().min(1).max(160),
  spotifyId: z.string().regex(/^[a-zA-Z0-9]{22}$/).nullable(),
  genres: z.array(z.string().trim().min(1).max(70)).max(15),
  country: z.string().trim().max(120).nullable(),
}).strict();
type ArtistInput = z.infer<typeof artistSchema>;

const mutationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), artist: artistSchema }),
  z.object({ action: z.literal('import'), artists: z.array(artistSchema).min(1).max(100) }),
  z.object({ action: z.literal('update'), artistId: z.string().uuid(), artist: artistSchema }),
  z.object({ action: z.literal('delete'), artistId: z.string().uuid() }),
  z.object({ action: z.literal('update_status'), artistId: z.string().uuid(), status: z.enum(['active', 'ACTIVE', 'RESTRICTED', 'BANNED']) }),
  z.object({ action: z.literal('force_sync') }),
]);

async function findDuplicate(db: AppSupabaseClient, artist: ArtistInput, ignoreId?: string) {
  if (artist.spotifyId) {
    const { data, error } = await db.from('artists').select('id')
      .eq('spotifyId', artist.spotifyId).maybeSingle();
    if (error) throw new ApiError(500, 'Spotify-ID konnte nicht geprüft werden.');
    if (data && data.id !== ignoreId) return true;
  }
  const escapedName = artist.name.replace(/[%_\\]/g, '\\$&');
  const { data, error } = await db.from('artists').select('id,name')
    .ilike('name', escapedName).limit(10);
  if (error) throw new ApiError(500, 'Artist-Name konnte nicht geprüft werden.');
  return (data ?? []).some(row =>
    row.id !== ignoreId && row.name.toLocaleLowerCase('de') === artist.name.toLocaleLowerCase('de')
  );
}

async function insertArtist(db: AppSupabaseClient, artist: ArtistInput, source: 'manual' | 'csv-upload') {
  if (await findDuplicate(db, artist)) return false;
  const { error } = await db.from('artists').insert({
    ...artist,
    source,
    status: 'pending_review',
    isVisible: false,
  });
  if (error) {
    // A concurrent import may have created this Spotify ID in the meantime.
    if (error.code === '23505') return false;
    throw new Error(error.message);
  }
  return true;
}

async function audit(db: AppSupabaseClient, adminId: string, action: string, details: Record<string, unknown>) {
  const { error } = await db.from('audit_logs').insert({ adminId, action, details });
  if (error) throw new ApiError(500, 'Änderung gespeichert, aber Audit-Log fehlgeschlagen.');
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  const db = createServiceRoleSupabaseClient();
  if (req.nextUrl.searchParams.get('view') === 'list') {
    const page = Math.min(10000, Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0));
    const size = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('size')) || 10));
    const search = (req.nextUrl.searchParams.get('search') ?? '').trim().slice(0, 100);
    const visibility = req.nextUrl.searchParams.get('visibility');
    let query = db.from('artists')
      .select('id,name,spotifyId,genres,country,isVisible,status,source,createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false }).order('id', { ascending: true })
      .range(page * size, page * size + size - 1);
    if (visibility === 'visible') query = query.eq('isVisible', true);
    if (visibility === 'hidden') query = query.eq('isVisible', false);
    if (visibility === 'pending') query = query.eq('isVisible', false).eq('status', 'pending_review');
    if (search) query = query.ilike('name', '%' + search.replace(/[%_\\]/g, '\\$&') + '%');
    const { data, count, error } = await query;
    if (error) throw new ApiError(500, 'Artist-Liste konnte nicht geladen werden.');
    return NextResponse.json({ artists: data ?? [], total: count ?? 0, page, size });
  }

  const { data: blacklist, error } = await db
    .from('artists')
    .select('*')
    .in('status', ['RESTRICTED', 'BANNED'])
    .order('updatedAt', { ascending: false });
  if (error) throw new ApiError(500, error.message);
  return NextResponse.json({ blacklist: blacklist ?? [] });
});

export const POST = withAdminAuth(async (req: NextRequest, adminId: string) => {
  let json: unknown;
  try { json = await req.json(); } catch { throw new ApiError(400, 'Ungültiger JSON-Body.'); }
  const parsed = mutationSchema.safeParse(json);
  if (!parsed.success) throw new ApiError(400, 'Ungültige Artist-Daten.');
  const body = parsed.data;
  const db = createServiceRoleSupabaseClient();

  if (body.action === 'create') {
    if (!(await insertArtist(db, body.artist, 'manual'))) {
      throw new ApiError(409, 'Artist mit diesem Namen oder dieser Spotify-ID existiert bereits.');
    }
    await audit(db, adminId, 'ARTIST_CREATE', { name: body.artist.name });
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (body.action === 'import') {
    const { data, error } = await db.rpc('import_admin_artists', {
      p_rows: body.artists, p_admin_id: adminId,
    });
    if (error) throw new ApiError(503, 'CSV-Import fehlgeschlagen: ' + error.message);
    return NextResponse.json({ success: true, created: data.created,
      skipped: data.skipped, errors: [] });
  }

  if (body.action === 'update') {
    const { data: current, error: lookupError } = await db.from('artists')
      .select('id').eq('id', body.artistId).maybeSingle();
    if (lookupError) throw new ApiError(500, 'Artist konnte nicht geladen werden.');
    if (!current) throw new ApiError(404, 'Artist nicht gefunden.');
    if (await findDuplicate(db, body.artist, body.artistId)) {
      throw new ApiError(409, 'Name oder Spotify-ID ist bereits vergeben.');
    }
    const { error } = await db.from('artists').update({
      ...body.artist,
      updatedAt: new Date().toISOString(),
    }).eq('id', body.artistId);
    if (error) throw new ApiError(500, 'Artist konnte nicht gespeichert werden.');
    await audit(db, adminId, 'ARTIST_UPDATE', { artistId: body.artistId });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'delete') {
    const { count, error: countError } = await db.from('releases')
      .select('id', { count: 'exact', head: true }).eq('artistId', body.artistId);
    if (countError) throw new ApiError(500, 'Verknüpfte Releases konnten nicht geprüft werden.');
    if ((count ?? 0) > 0) {
      throw new ApiError(409, 'Artist hat Releases. Diese zuerst separat bearbeiten oder löschen.');
    }
    const { error } = await db.from('artists').delete().eq('id', body.artistId);
    if (error) throw new ApiError(500, 'Artist konnte nicht gelöscht werden.');
    await audit(db, adminId, 'ARTIST_DELETE', { artistId: body.artistId });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'update_status') {
    const status = body.status === 'ACTIVE' ? 'active' : body.status;
    if (status !== 'active') {
      const { error } = await db.from('releases').update({ isVisible: false }).eq('artistId', body.artistId);
      if (error) throw new ApiError(500, 'Releases konnten nicht verborgen werden.');
    }
    const { data: updated, error } = await db.from('artists')
      .update({ status, ...(status !== 'active' ? { isVisible: false } : {}) })
      .eq('id', body.artistId).select().single();
    if (error) throw new ApiError(500, error.message);
    await audit(db, adminId, 'ARTIST_STATUS_UPDATE', { artistId: body.artistId, status });
    return NextResponse.json({ success: true, artist: updated });
  }

  const sync = await enqueueAllVisibleArtists(db, 'full');
  await audit(db, adminId, 'FORCE_ARTIST_SYNC', sync);
  return NextResponse.json({ success: true, queued: sync.queued, total: sync.total, message: 'Sync queued' });
});
