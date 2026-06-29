import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

const bodySchema = z.object({
  provider: z.enum(['spotify', 'google']),
  email: z.string().email(),
  name: z.string().min(1),
  providerId: z.string().min(1),
  picture: z.string().url().optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid OAuth callback payload');
  }

  const { provider, email, name, providerId, picture } = parsed.data;

  try {
    const result = await authService.loginOrRegisterOAuth({
      email,
      name,
      provider,
      providerId,
    });

    const supabase = createServiceRoleSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*, fanProfile:fan_profiles(*)')
      .eq('id', result.user.id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, error.message);
    }

    if (picture && user?.fanProfile) {
      await supabase
        .from('fan_profiles')
        .update({ avatarUrl: picture })
        .eq('userId', result.user.id);
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: {
        ...result.user,
        fanProfile: user?.fanProfile ?? null,
      },
    });

    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 20,
    });
  } catch (error) {
    logger.error('OAuth session creation failed', {
      error: error instanceof Error ? error.message : error,
      provider,
    });
    if (error instanceof Error && error.message === 'Account suspended') {
      throw new ApiError(403, 'Account suspended');
    }
    throw new ApiError(500, 'Failed to create OAuth session');
  }
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});