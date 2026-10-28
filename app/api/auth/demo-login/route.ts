import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { DEMO_AUTH_COOKIE } from '@/lib/auth/demoAccounts';

// Demo login is permanently disabled for the production-only prototype.
// Never create virtual ADMIN accounts or sign isDemo JWTs.
export const POST = withErrorHandler(async () => {
  throw new ApiError(403, 'Demo login is disabled', 'DEMO_DISABLED');
});

// Logout still clears old demo cookies from browsers.
export const DELETE = withErrorHandler(async () => {
  const response = NextResponse.json({ success: true });
  response.cookies.set(DEMO_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
});

export const OPTIONS = withErrorHandler(async (_req: NextRequest) =>
  NextResponse.json(null, { status: 200, headers: { Allow: 'POST,DELETE,OPTIONS' } })
);
