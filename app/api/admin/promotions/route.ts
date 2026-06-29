import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*, user:users(email)')
    .order('createdAt', { ascending: false });

  if (error) throw new ApiError(500, error.message);
  return NextResponse.json({ bookings: bookings ?? [] });
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