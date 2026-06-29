-- Spotlight Stripe self-service columns on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "stripePaymentId" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "amountCents" INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'eur';