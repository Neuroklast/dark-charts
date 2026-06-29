import { randomBytes, createHash } from 'crypto';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateEmailVerificationToken(): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildVerificationUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
}