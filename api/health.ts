import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { logger } from '../src/lib/logger';
import { handleCors } from './_lib/cors';
import { applyRateLimit } from './_lib/rate-limit';

interface CheckResult {
  ok: boolean;
  message: string;
}

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  checks: Record<string, CheckResult>;
  setup_required: string[];
}

const REQUIRED_ENV_VARS: { key: string; description: string }[] = [
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string (e.g. postgresql://user:pass@host/db)' },
  { key: 'JWT_SECRET', description: 'Secret key used to sign admin JWTs (use a long random string)' },
];

const OPTIONAL_ENV_VARS: { key: string; description: string }[] = [
  { key: 'SPOTIFY_CLIENT_ID', description: 'Spotify API client ID for streaming data sync' },
  { key: 'SPOTIFY_CLIENT_SECRET', description: 'Spotify API client secret for streaming data sync' },
  { key: 'ALLOWED_ORIGIN', description: 'CORS allowed origin (defaults to * if not set)' },
];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (handleCors(request, response, 'GET,OPTIONS')) return;
  if (!applyRateLimit(request, response, { maxRequests: 30 })) return;

  logger.info(`Incoming request: ${request.method} ${request.url}`, {
    method: request.method,
    path: request.url,
  });

  if (request.method !== 'GET') {
    return response.status(405).json({
      status: 'error',
      message: `Method ${request.method} Not Allowed`,
    });
  }

  const checks: Record<string, CheckResult> = {};
  const setupRequired: string[] = [];

  // Check required environment variables
  for (const { key, description } of REQUIRED_ENV_VARS) {
    if (process.env[key]) {
      checks[`env_${key}`] = { ok: true, message: 'Configured' };
    } else {
      checks[`env_${key}`] = { ok: false, message: `Missing – ${description}` };
      setupRequired.push(`Set environment variable ${key}: ${description}`);
    }
  }

  // Check optional environment variables (warn only)
  for (const { key, description } of OPTIONAL_ENV_VARS) {
    if (process.env[key]) {
      checks[`env_${key}`] = { ok: true, message: 'Configured' };
    } else {
      checks[`env_${key}`] = { ok: false, message: `Not set (optional) – ${description}` };
    }
  }

  // Check database connectivity
  let dbOk = false;
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
    dbOk = true;
    checks['database'] = { ok: true, message: `Connected – ${userCount} user(s) in database` };
  } catch (error) {
    checks['database'] = {
      ok: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
    setupRequired.push(
      'Ensure DATABASE_URL points to a running PostgreSQL instance and run `npx prisma migrate deploy` to apply migrations'
    );
    logger.error('Database connection error', { error, method: request.method, path: request.url });
  }

  const criticalFailing = REQUIRED_ENV_VARS.some(({ key }) => !process.env[key]) || !dbOk;
  const overallStatus: HealthStatus['status'] = criticalFailing ? 'degraded' : 'ok';

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    setup_required: setupRequired,
  };

  return response.status(criticalFailing ? 503 : 200).json(body);
}
