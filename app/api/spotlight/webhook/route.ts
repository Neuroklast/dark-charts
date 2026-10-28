import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/** Payment state is authoritative only after verified Stripe webhook delivery. */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    logger.warn('Stripe webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supported = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
  ]);
  if (!supported.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId || session.mode !== 'payment') {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id,status,stripeSessionId,amountCents,currency,userId')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    logger.error('Could not load Spotlight booking', { bookingId, code: bookingError.code });
    return NextResponse.json({ error: 'Booking lookup failed' }, { status: 500 });
  }
  if (!booking || booking.stripeSessionId !== session.id ||
      session.client_reference_id !== bookingId ||
      session.metadata?.userId !== booking.userId ||
      booking.amountCents !== session.amount_total ||
      booking.currency?.toLowerCase() !== session.currency?.toLowerCase()) {
    logger.warn('Spotlight webhook booking mismatch', { bookingId, eventId: event.id });
    return NextResponse.json({ error: 'Booking mismatch' }, { status: 400 });
  }

  const paid = (event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded') &&
    session.payment_status === 'paid';
  const failed = event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed';

  if (paid && booking.status === 'pending') {
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id ?? null;

    const { error } = await supabase.from('bookings').update({
      status: 'PAID',
      stripePaymentId: paymentIntentId ?? session.id,
      updatedAt: new Date().toISOString(),
    }).eq('id', bookingId).eq('status', 'pending');

    if (error) {
      logger.error('Could not mark Spotlight booking paid', { bookingId, code: error.code });
      return NextResponse.json({ error: 'Booking update failed' }, { status: 500 });
    }
  } else if (failed && booking.status === 'pending') {
    const { error } = await supabase.from('bookings').update({
      status: 'expired',
      updatedAt: new Date().toISOString(),
    }).eq('id', bookingId).eq('status', 'pending');

    if (error) {
      logger.error('Could not expire Spotlight booking', { bookingId, code: error.code });
      return NextResponse.json({ error: 'Booking update failed' }, { status: 500 });
    }
  } else if (paid && booking.status !== 'PAID') {
    // A late payment must not silently reclaim an already sold slot.
    // Flag for an explicit reconciliation/refund workflow.
    logger.error('Late Spotlight payment requires reconciliation', {
      bookingId, eventId: event.id, status: booking.status,
    });
    return NextResponse.json({ error: 'Payment requires reconciliation' }, { status: 409 });
  }

  return NextResponse.json({ received: true });
}
