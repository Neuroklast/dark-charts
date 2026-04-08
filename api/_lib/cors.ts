import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

export function setCorsHeaders(res: VercelResponse, methods: string = 'GET,OPTIONS'): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
  );
}

/**
 * Handles CORS preflight and sets headers.
 * Returns true if the request was a preflight (caller should return early).
 */
export function handleCors(req: VercelRequest, res: VercelResponse, methods: string = 'GET,OPTIONS'): boolean {
  setCorsHeaders(res, methods);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
