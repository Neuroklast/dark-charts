import { NextRequest } from 'next/server';
import { authService } from '@/backend/services/AuthService';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export interface ApiAuthContext {
  type: 'jwt' | 'api_key';
  userId?: string;
  email?: string;
  role?: string;
}

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: Missing or invalid token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = await authService.verifyToken(token);

  if (!decoded) {
    throw new ApiError(401, 'Unauthorized: Invalid token');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, isSuspended')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to verify user');
  }

  if (!user) {
    throw new ApiError(401, 'Unauthorized: User not found');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Account suspended');
  }

  return decoded;
}

/**
 * Token-geschützter API-Zugang für /api/v1/*.
 * Akzeptiert JWT (Login/Demo/OAuth) oder statischen DATA_API_TOKEN.
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

  const decoded = await authService.verifyToken(token);
  if (!decoded) {
    throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, isSuspended')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to verify user');
  }

  if (!user) {
    throw new ApiError(401, 'Unauthorized: User not found');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Account suspended');
  }

  return {
    type: 'jwt',
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

export { getStartOfWeek } from '@/lib/week';