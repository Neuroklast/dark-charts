/**
 * Trust levels reduce Sybil impact from disposable email accounts.
 * OAuth users receive higher weight; listening-history boost is reserved for level 3.
 */

export type TrustLevel = 0 | 1 | 2 | 3;

export const TRUST_LEVEL_WEIGHTS: Record<TrustLevel, number> = {
  0: 0.1, // unverified email registration
  1: 0.5, // verified email
  2: 1.0, // OAuth (Spotify / Google)
  3: 1.25, // OAuth + listening-history match (future)
};

export function normalizeTrustLevel(level: number | null | undefined): TrustLevel {
  if (level === 1 || level === 2 || level === 3) return level;
  return 0;
}

export function getTrustWeight(level: number | null | undefined): number {
  return TRUST_LEVEL_WEIGHTS[normalizeTrustLevel(level)];
}

export function trustLevelForProvider(
  provider: 'email' | 'spotify' | 'google' | null | undefined,
  emailVerified: boolean
): TrustLevel {
  if (provider === 'spotify' || provider === 'google') {
    return 2;
  }
  if (emailVerified) {
    return 1;
  }
  return 0;
}