import { describe, it, expect } from 'vitest';
import { calculateFanScore, UNIQUE_VOTER_WEIGHT } from './fan-scoring';

describe('calculateFanScore', () => {
  it('rewards unique voter breadth over single-account concentration', () => {
    const sybilVotes = Array.from({ length: 50 }, (_, i) => ({
      fanId: `fan-${i}`,
      cost: 1,
    }));
    const passionateVote = [{ fanId: 'real-fan', cost: 144 }];

    const sybilScore = calculateFanScore(sybilVotes);
    const passionateScore = calculateFanScore(passionateVote);

    expect(sybilScore).toBeGreaterThan(passionateScore);
    expect(sybilScore).toBe(50 * UNIQUE_VOTER_WEIGHT + 50);
    expect(passionateScore).toBe(UNIQUE_VOTER_WEIGHT + 12);
  });

  it('deduplicates multiple rows from same fan on same release', () => {
    const votes = [
      { fanId: 'fan-a', cost: 4 },
      { fanId: 'fan-a', cost: 9 },
    ];
    expect(calculateFanScore(votes)).toBe(UNIQUE_VOTER_WEIGHT + 5);
  });
});