import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthFromRequest } from '@/lib/auth/session';
import { ApiError, withErrorHandler } from '@/lib/errors';
import { logger } from '@/lib/logger';

const ADMIN_ROLES = new Set(['ADMIN', 'admin']);

export async function requireAdmin(req: NextRequest): Promise<string> {
  const resolved = await resolveAuthFromRequest(req);

  if (!resolved) {
    throw new ApiError(401, 'Unauthorized: Missing or invalid session');
  }

  if (!ADMIN_ROLES.has(resolved.role)) {
    logger.error('Forbidden access attempt: Insufficient permissions', {
      userId: resolved.userId,
      role: resolved.role,
    });
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  return resolved.userId;
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