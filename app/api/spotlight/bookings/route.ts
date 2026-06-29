import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { SPOTLIGHT_PRICES } from '@/lib/spotlight-config';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const supabase = createServiceRoleSupabaseClient();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('userId', decoded.userId)
    .order('slotDate', { ascending: false })
    .limit(50);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    bookings: bookings ?? [],
    prices: SPOTLIGHT_PRICES,
  });
});