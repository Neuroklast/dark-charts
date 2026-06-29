import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

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

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    logger.warn('Stripe webhook signature verification failed', { message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const supabase = createServiceRoleSupabaseClient();
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'PAID',
          stripeSessionId: session.id,
          stripePaymentId: paymentIntentId ?? session.id,
          amountCents: session.amount_total ?? undefined,
          currency: session.currency ?? undefined,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) {
        logger.error('Failed to mark booking as PAID', { bookingId, error: error.message });
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const supabase = createServiceRoleSupabaseClient();
      await supabase
        .from('bookings')
        .update({ status: 'expired', updatedAt: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('status', 'pending');
    }
  }

  return NextResponse.json({ received: true });
}