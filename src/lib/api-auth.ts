import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';
import { resolveAuthFromRequest } from '@/lib/auth/session';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export interface ApiAuthContext {
  type: 'session' | 'jwt' | 'api_key';
  userId?: string;
  email?: string;
  role?: string;
  isDemo?: boolean;
}

export async function requireAuth(req: NextRequest) {
  const resolved = await resolveAuthFromRequest(req);

  if (!resolved) {
    throw new ApiError(401, 'Unauthorized: Missing or invalid session');
  }

  return {
    userId: resolved.userId,
    email: resolved.email,
    role: resolved.role,
    isDemo: resolved.isDemo,
  };
}

export async function requireVerifiedVoter(
  decoded: { userId: string; isDemo?: boolean }
): Promise<void> {
  if (decoded.isDemo) return;

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('emailVerified, authProvider')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to verify email status');
  }

  if (!user?.emailVerified) {
    throw new ApiError(
      403,
      'Email verification required before voting',
      'EMAIL_NOT_VERIFIED'
    );
  }
}

/**
 * Token-geschützter API-Zugang für /api/v1/*.
 * Akzeptiert Supabase-Session/JWT (Login/Demo/OAuth) oder statischen DATA_API_TOKEN.
 */
export async function requireApiAccess(req: NextRequest): Promise<ApiAuthContext> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: Bearer token required');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new ApiError(401, 'Unauthorized: Token missing');
  }

  const apiKey = process.env.DATA_API_TOKEN;
  if (apiKey && token === apiKey) {
    return { type: 'api_key' };
  }

  const resolved = await resolveAuthFromRequest(req);
  if (!resolved) {
    throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }

  return {
    type: resolved.source === 'jwt' ? 'jwt' : 'session',
    userId: resolved.userId,
    email: resolved.email,
    role: resolved.role,
    isDemo: resolved.isDemo,
  };
}

export { getStartOfWeek } from '@/lib/week';