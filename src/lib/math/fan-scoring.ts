/**
 * Sybil-resistant fan score: breadth of support (unique voters) dominates
 * over depth (quadratic credit spend per account).
 *
 * Formula per release:
 *   fanScore = uniqueVoters × UNIQUE_VOTER_WEIGHT + Σ√(costᵢ)
 *
 * Example: 100 sybil accounts × 1 credit each → 100×1000 + 100 = 100 100
 *          1 passionate fan × 144 credits     → 1×1000 + 12   = 1 012
 * Sybil still scales linearly with accounts — full mitigation requires
 * identity/trust levels (documented on /methodology).
 */

export const UNIQUE_VOTER_WEIGHT = 1000;

export interface FanVoteInput {
  fanId: string;
  cost: number;
}

export function calculateFanScore(votes: FanVoteInput[]): number {
  if (votes.length === 0) return 0;

  const uniqueFans = new Set(votes.map((v) => v.fanId));
  const sqrtCostSum = votes.reduce((sum, v) => sum + Math.sqrt(Math.max(0, v.cost ?? 0)), 0);

  return uniqueFans.size * UNIQUE_VOTER_WEIGHT + sqrtCostSum;
}

export function calculateCommunityPowerPercent(
  releaseFanScore: number,
  totalFanScore: number
): number {
  if (totalFanScore <= 0) return 0;
  return Math.round((releaseFanScore / totalFanScore) * 100);
}