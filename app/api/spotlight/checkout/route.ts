import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import {
  SPOTLIGHT_BOOKING_ROLES,
  SPOTLIGHT_MAX_DAYS_AHEAD,
  SPOTLIGHT_PENDING_TTL_MS,
  SPOTLIGHT_PRICES,
  SPOTLIGHT_SLOT_TYPES,
  normalizeSlotDate,
  type SpotlightSlotType,
} from '@/lib/spotlight-config';
import { getAppBaseUrl, getStripe } from '@/lib/stripe';

const bodySchema = z.object({
  slotType: z.enum(SPOTLIGHT_SLOT_TYPES),
  slotDate: z.string().min(1),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const role = decoded.role?.toUpperCase();

  if (!role || !SPOTLIGHT_BOOKING_ROLES.includes(role as (typeof SPOTLIGHT_BOOKING_ROLES)[number])) {
    throw new ApiError(403, 'Only Band and Label accounts can book Spotlight slots');
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new ApiError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid booking parameters', 'VALIDATION_ERROR');
  }

  const { slotType, slotDate } = parsed.data;
  const slotDay = normalizeSlotDate(slotDate);
  const today = normalizeSlotDate(new Date());
  const maxDate = new Date(today);
  maxDate.setUTCDate(maxDate.getUTCDate() + SPOTLIGHT_MAX_DAYS_AHEAD);

  if (slotDay.getTime() < today.getTime()) {
    throw new ApiError(400, 'Slot date must be today or in the future');
  }
  if (slotDay.getTime() > maxDate.getTime()) {
    throw new ApiError(400, `Slots can only be booked up to ${SPOTLIGHT_MAX_DAYS_AHEAD} days ahead`);
  }

  const price = SPOTLIGHT_PRICES[slotType as SpotlightSlotType];
  const supabase = createServiceRoleSupabaseClient();

  const { data: existingBookings, error: existingError } = await supabase
    .from('bookings')
    .select('id, status, createdAt')
    .eq('slotDate', slotDay.toISOString())
    .eq('slotType', slotType)
    .in('status', ['PAID', 'pending']);

  if (existingError) throw new ApiError(500, existingError.message);

  const pendingCutoff = Date.now() - SPOTLIGHT_PENDING_TTL_MS;
  const blocking = (existingBookings ?? []).find((booking) => {
    if (booking.status === 'PAID') return true;
    return new Date(booking.createdAt).getTime() >= pendingCutoff;
  });

  if (blocking) {
    throw new ApiError(409, 'This Spotlight slot is already reserved', 'SLOT_UNAVAILABLE');
  }

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      userId: decoded.userId,
      slotDate: slotDay.toISOString(),
      slotType,
      status: 'pending',
      amountCents: price.amountCents,
      currency: price.currency,
    })
    .select('id')
    .single();

  if (insertError || !booking) {
    throw new ApiError(500, insertError?.message ?? 'Failed to create booking');
  }

  const appUrl = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: decoded.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: price.currency,
          unit_amount: price.amountCents,
          product_data: {
            name: `Dark Charts Spotlight — ${slotType}`,
            description: `Promotional slot for ${slotDay.toISOString().slice(0, 10)}`,
          },
        },
      },
    ],
    metadata: {
      bookingId: booking.id,
      userId: decoded.userId,
      slotType,
      slotDate: slotDay.toISOString(),
    },
    success_url: `${appUrl}/spotlight?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/spotlight?canceled=1`,
  });

  const { error: sessionUpdateError } = await supabase
    .from('bookings')
    .update({ stripeSessionId: session.id })
    .eq('id', booking.id);

  if (sessionUpdateError) {
    throw new ApiError(500, sessionUpdateError.message);
  }

  if (!session.url) {
    throw new ApiError(500, 'Stripe checkout session has no URL');
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: session.url,
    bookingId: booking.id,
  });
});