import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const REQUIRED_ENV_VARS: { key: string; description: string }[] = [
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET', description: 'Secret key used to sign JWTs' },
];

const OPTIONAL_ENV_VARS: { key: string; description: string }[] = [
  { key: 'SPOTIFY_CLIENT_ID', description: 'Spotify API client ID' },
  { key: 'SPOTIFY_CLIENT_SECRET', description: 'Spotify API client secret' },
  { key: 'ALLOWED_ORIGIN', description: 'CORS allowed origin' },
];

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 30 });
  if (rateLimited) return rateLimited;

  const checks: Record<string, { ok: boolean; message: string }> = {};
  const setupRequired: string[] = [];

  for (const { key, description } of REQUIRED_ENV_VARS) {
    if (process.env[key]) {
      checks[`env_${key}`] = { ok: true, message: 'Configured' };
    } else {
      checks[`env_${key}`] = { ok: false, message: `Missing – ${description}` };
      setupRequired.push(`Set environment variable ${key}: ${description}`);
    }
  }

  for (const { key, description } of OPTIONAL_ENV_VARS) {
    if (process.env[key]) {
      checks[`env_${key}`] = { ok: true, message: 'Configured' };
    } else {
      checks[`env_${key}`] = { ok: false, message: `Not set (optional) – ${description}` };
    }
  }

  let dbOk = false;
  let userCount = 0;

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    userCount = count ?? 0;
    dbOk = true;
    checks.database = {
      ok: true,
      message: `Connected – ${userCount} user(s) in database`,
    };
  } catch (error) {
    checks.database = {
      ok: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
    setupRequired.push('Ensure Supabase/PostgreSQL is reachable and schema is applied');
    logger.error('Database connection error', { error });
  }

  const criticalFailing =
    REQUIRED_ENV_VARS.some(({ key }) => !process.env[key]) || !dbOk;

  const body = {
    status: criticalFailing ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    checks,
    setup_required: setupRequired,
  };

  const response = NextResponse.json(body, { status: criticalFailing ? 503 : 200 });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 30,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});