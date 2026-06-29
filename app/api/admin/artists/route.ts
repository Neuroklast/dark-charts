import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const { data: blacklist, error } = await supabase
    .from('artists')
    .select('*')
    .in('status', ['RESTRICTED', 'BANNED'])
    .order('updatedAt', { ascending: false });

  if (error) throw new ApiError(500, error.message);
  return NextResponse.json({ blacklist: blacklist ?? [] });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action, artistId, status } = body ?? {};

  if (!action) throw new ApiError(400, 'Action is required');

  const supabase = createServiceRoleSupabaseClient();

  if (action === 'update_status' && artistId && status) {
    const { data: updated, error } = await supabase
      .from('artists')
      .update({ status })
      .eq('id', artistId)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'ARTIST_STATUS_UPDATE',
      details: { artistId, status },
    });

    return NextResponse.json({ success: true, artist: updated });
  }

  if (action === 'force_sync') {
    await supabase.from('audit_logs').insert({
      adminId,
      action: 'FORCE_ARTIST_SYNC',
      details: {},
    });
    return NextResponse.json({ success: true, message: 'Sync triggered' });
  }

  throw new ApiError(400, 'Invalid action or missing parameters');
});