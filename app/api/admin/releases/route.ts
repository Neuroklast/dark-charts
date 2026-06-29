import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (req) => {
  const supabase = createServiceRoleSupabaseClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const visibility = searchParams.get('visibility');
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);

  let query = supabase
    .from('releases')
    .select('*, artist:artists(id, name, spotifyId)', { count: 'exact' })
    .order('releaseDate', { ascending: false })
    .range(offset, offset + limit - 1);

  if (visibility === 'visible') query = query.eq('isVisible', true);
  if (visibility === 'hidden') query = query.eq('isVisible', false);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, error.message);

  return NextResponse.json({
    releases: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action, releaseId, isVisible } = body ?? {};
  if (!action) throw new ApiError(400, 'Action is required');

  const supabase = createServiceRoleSupabaseClient();

  if (action === 'toggle_visibility' && releaseId && typeof isVisible === 'boolean') {
    const { data: updated, error } = await supabase
      .from('releases')
      .update({ isVisible })
      .eq('id', releaseId)
      .select('*, artist:artists(id, name)')
      .single();

    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'RELEASE_VISIBILITY',
      details: { releaseId, isVisible },
    });

    return NextResponse.json({ success: true, release: updated });
  }

  if (action === 'delete' && releaseId) {
    const { error } = await supabase.from('releases').delete().eq('id', releaseId);
    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'RELEASE_DELETE',
      details: { releaseId },
    });

    return NextResponse.json({ success: true });
  }

  throw new ApiError(400, 'Invalid action or missing parameters');
});