import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  // Only clean up every 60 seconds
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > now - 120_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * In-memory sliding window rate limiter.
 * Returns true if the request is allowed, false if rate limited.
 * Sets standard rate-limit response headers.
 */
export function applyRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  { windowMs = 60_000, maxRequests = 60 }: { windowMs?: number; maxRequests?: number } = {}
): boolean {
  cleanup();

  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.timestamps.length)));

  if (entry.timestamps.length >= maxRequests) {
    const resetAt = entry.timestamps[0] + windowMs;
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    res.setHeader('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }

  entry.timestamps.push(now);
  return true;
}
