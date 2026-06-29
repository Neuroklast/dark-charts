import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { authService } from '@/backend/services/AuthService';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  try {
    await authService.verifyEmail(token);
    return NextResponse.json({ success: true, message: 'Email verified' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    throw new ApiError(400, message, 'VERIFICATION_FAILED');
  }
});