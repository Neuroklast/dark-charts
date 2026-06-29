import { describe, it, expect } from 'vitest';
import {
  getTrustWeight,
  trustLevelForProvider,
  TRUST_LEVEL_WEIGHTS,
} from './trust-level';
import { calculateFanScore, UNIQUE_VOTER_WEIGHT } from '@/lib/math/fan-scoring';

describe('trust-level', () => {
  it('assigns lower weight to unverified email accounts', () => {
    expect(getTrustWeight(0)).toBe(TRUST_LEVEL_WEIGHTS[0]);
    expect(getTrustWeight(2)).toBe(1);
  });

  it('maps OAuth providers to trust level 2', () => {
    expect(trustLevelForProvider('spotify', false)).toBe(2);
    expect(trustLevelForProvider('email', true)).toBe(1);
    expect(trustLevelForProvider('email', false)).toBe(0);
  });

  it('reduces sybil impact when votes use low trust weights', () => {
    const sybilVotes = Array.from({ length: 50 }, (_, i) => ({
      fanId: `fan-${i}`,
      cost: 1,
      trustWeight: getTrustWeight(0),
    }));
    const oauthVotes = [{ fanId: 'oauth-fan', cost: 144, trustWeight: getTrustWeight(2) }];

    const sybilScore = calculateFanScore(sybilVotes);
    const oauthScore = calculateFanScore(oauthVotes);

    expect(oauthScore).toBeGreaterThan(sybilScore / 10);
    expect(oauthScore).toBe(UNIQUE_VOTER_WEIGHT + 12);
  });
});