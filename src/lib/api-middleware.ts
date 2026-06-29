import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - 120_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function setCorsHeaders(
  response: NextResponse,
  methods: string = 'GET,OPTIONS'
): NextResponse {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, X-Admin-Init-Secret'
  );
  return response;
}

export function handleCors(
  req: NextRequest,
  methods: string = 'GET,OPTIONS'
): NextResponse | null {
  if (req.method === 'OPTIONS') {
    return setCorsHeaders(new NextResponse(null, { status: 200 }), methods);
  }
  return null;
}

export function applyCorsToResponse(
  response: NextResponse,
  methods: string = 'GET,OPTIONS'
): NextResponse {
  return setCorsHeaders(response, methods);
}

export function applyRateLimit(
  req: NextRequest,
  { windowMs = 60_000, maxRequests = 60 }: { windowMs?: number; maxRequests?: number } = {}
): NextResponse | null {
  cleanup();

  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const resetAt = entry.timestamps[0] + windowMs;
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED', status: 429 },
      { status: 429 }
    );
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    response.headers.set('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
    return response;
  }

  entry.timestamps.push(now);
  return null;
}

export function setRateLimitHeaders(
  response: NextResponse,
  req: NextRequest,
  { windowMs = 60_000, maxRequests = 60 }: { windowMs?: number; maxRequests?: number } = {}
): NextResponse {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - windowMs;
  const entry = store.get(ip);
  const count = entry
    ? entry.timestamps.filter((t) => t > windowStart).length
    : 0;

  response.headers.set('X-RateLimit-Limit', String(maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - count)));
  return response;
}