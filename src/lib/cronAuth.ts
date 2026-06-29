import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireCronAuth(req: NextRequest): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new ApiError(503, 'Cron authentication is not configured');
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token || !safeCompare(token, secret)) {
    throw new ApiError(401, 'Unauthorized');
  }
}

export function isCronRequest(req: NextRequest): boolean {
  try {
    requireCronAuth(req);
    return true;
  } catch {
    return false;
  }
}