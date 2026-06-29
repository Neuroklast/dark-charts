import { describe, it, expect } from 'vitest';
import { calculateExpertPoints } from './expert-ranking';

describe('calculateExpertPoints', () => {
  it('applies minimum reputation of 1', () => {
    expect(calculateExpertPoints(1, 0)).toBe(10);
    expect(calculateExpertPoints(1, -5)).toBe(10);
  });

  it('scales by reputation score', () => {
    expect(calculateExpertPoints(1, 2)).toBe(20);
    expect(calculateExpertPoints(5, 1.5)).toBe(3);
  });

  it('returns correct base points per rank', () => {
    expect(calculateExpertPoints(1, 1)).toBe(10);
    expect(calculateExpertPoints(2, 1)).toBe(8);
    expect(calculateExpertPoints(3, 1)).toBe(6);
    expect(calculateExpertPoints(10, 1)).toBe(1);
  });
});