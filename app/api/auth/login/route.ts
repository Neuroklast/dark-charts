import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { authService } from '@/backend/services/AuthService';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  try {
    const result = await authService.login({ email, password });
    const supabase = createServiceRoleSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*, fanProfile:fan_profiles(*), djProfile:dj_profiles(*), bandProfile:band_profiles(*), labelProfile:label_profiles(*)')
      .eq('id', result.user.id)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);

    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: {
        ...result.user,
        fanProfile: user?.fanProfile ?? null,
        djProfile: user?.djProfile ?? null,
        bandProfile: user?.bandProfile ?? null,
        labelProfile: user?.labelProfile ?? null,
      },
    });

    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 10,
    });
  } catch (error) {
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : error,
    });
    throw new ApiError(401, 'Invalid credentials');
  }
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});