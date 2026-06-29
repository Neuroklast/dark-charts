import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireApiAccess } from '@/lib/api-auth';

type V1Handler = (req: NextRequest) => Promise<Record<string, unknown>>;

export function createV1GetHandler(
  handler: V1Handler,
  options: { maxRequests?: number } = {}
) {
  const maxRequests = options.maxRequests ?? 60;

  return withErrorHandler(async (req: NextRequest) => {
    const cors = handleCors(req, 'GET,OPTIONS');
    if (cors) return cors;

    const rateLimited = applyRateLimit(req, { maxRequests });
    if (rateLimited) return rateLimited;

    await requireApiAccess(req);
    const data = await handler(req);

    const response = NextResponse.json({ success: true, ...data });
    return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
      maxRequests,
    });
  });
}

export const v1OptionsHandler = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});