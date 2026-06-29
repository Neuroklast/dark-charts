import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { authService } from '@/backend/services/AuthService';
import { logger } from '@/lib/logger';

const VALID_ROLES = ['FAN', 'DJ', 'BAND', 'LABEL'] as const;
type AllowedRole = (typeof VALID_ROLES)[number];

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { email, password, role, profileData } = body ?? {};

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Invalid request format');
  }

  if (role === 'ADMIN') {
    throw new ApiError(403, 'Admin accounts cannot be self-registered');
  }

  if (role && !VALID_ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const userRole: AllowedRole = VALID_ROLES.includes(role) ? role : 'FAN';

  try {
    const result = await authService.register({
      email,
      password,
      role: userRole,
      profileData,
    });

    const response = NextResponse.json(
      { success: true, token: result.token, user: result.user },
      { status: 201 }
    );

    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 5,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    logger.error('Registration failed', { error: message });

    if (message.includes('already exists')) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    throw new ApiError(500, 'Registration failed. Please try again.');
  }
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});