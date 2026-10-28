import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (req) => {
  const page = Math.min(10000, Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0));
  const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('limit')) || 10));
  const supabase = createServiceRoleSupabaseClient();
  const { data: bookings, error, count } = await supabase
    .from('bookings')
    .select('*, user:users(email)', { count: 'exact' })
    .order('createdAt', { ascending: false }).order('id', { ascending: true })
    .range(page * limit, page * limit + limit - 1);

  if (error) throw new ApiError(500, error.message);
  return NextResponse.json({ bookings: bookings ?? [], total: count ?? 0, page, limit });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action, bookingId, status } = body ?? {};
  const supabase = createServiceRoleSupabaseClient();

  if (action === 'update_status' && bookingId && status) {
    const { data: updated, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await supabase.from('audit_logs').insert({
      adminId,
      action: 'PROMOTION_STATUS_UPDATE',
      details: { bookingId, status },
    });

    return NextResponse.json({ success: true, booking: updated });
  }

  throw new ApiError(400, 'Invalid action');
});