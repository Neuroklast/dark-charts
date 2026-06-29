import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { SPOTLIGHT_PENDING_TTL_MS, normalizeSlotDate } from '@/lib/spotlight-config';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 120 });
  if (rateLimited) return rateLimited;

  const slotType = req.nextUrl.searchParams.get('slotType');
  const fromParam = req.nextUrl.searchParams.get('from');
  const toParam = req.nextUrl.searchParams.get('to');

  const from = normalizeSlotDate(fromParam ? new Date(fromParam) : new Date());
  const to = normalizeSlotDate(
    toParam ? new Date(toParam) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );

  const supabase = createServiceRoleSupabaseClient();
  let query = supabase
    .from('bookings')
    .select('slotDate, slotType, status, createdAt')
    .gte('slotDate', from.toISOString())
    .lte('slotDate', to.toISOString())
    .in('status', ['PAID', 'pending']);

  if (slotType) {
    query = query.eq('slotType', slotType);
  }

  const { data, error } = await query;
  if (error) throw error;

  const pendingCutoff = Date.now() - SPOTLIGHT_PENDING_TTL_MS;
  const bookedDates = new Set<string>();

  for (const booking of data ?? []) {
    if (booking.status === 'pending' && new Date(booking.createdAt).getTime() < pendingCutoff) {
      continue;
    }
    bookedDates.add(booking.slotDate.slice(0, 10));
  }

  const response = NextResponse.json({
    success: true,
    slotType: slotType ?? null,
    bookedDates: [...bookedDates],
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});