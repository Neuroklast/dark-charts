import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { authService } from '@/backend/services/AuthService';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);

  try {
    await authService.resendVerificationEmail(decoded.userId);
    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend email';
    throw new ApiError(400, message);
  }
});