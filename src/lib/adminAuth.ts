import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError, withErrorHandler } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface JwtPayload {
  userId: string;
  role: string;
  exp: number;
}

export async function requireAdmin(req: NextRequest): Promise<string> {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET environment variable is not set');
    throw new ApiError(503, 'Service unavailable: authentication is not configured');
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: Missing or invalid token format');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new ApiError(401, 'Unauthorized: Token missing');
  }

  let decoded: JwtPayload;
  try {
    decoded = verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    logger.error('Unauthorized access attempt: Invalid token', { error: message });
    throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }

  if (!decoded?.userId || decoded.role !== 'ADMIN') {
    logger.error('Forbidden access attempt: Insufficient permissions', {
      userId: decoded?.userId,
      role: decoded?.role,
    });
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to verify admin user');
  }

  if (!user) {
    logger.error('Forbidden access attempt: User not found in database', {
      userId: decoded.userId,
    });
    throw new ApiError(403, 'Forbidden: User no longer exists');
  }

  if (user.role !== 'ADMIN') {
    logger.error('Forbidden access attempt: User role revoked in database', {
      userId: decoded.userId,
      dbRole: user.role,
    });
    throw new ApiError(403, 'Forbidden: Admin privileges revoked');
  }

  return decoded.userId;
}

type AdminRouteHandler = (
  req: NextRequest,
  adminId: string,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAdminAuth(handler: AdminRouteHandler) {
  return withErrorHandler(async (req, context) => {
    const adminId = await requireAdmin(req);
    return handler(req, adminId, context);
  });
}