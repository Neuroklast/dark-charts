/**
 * Sybil-resistant fan score: breadth of support (unique voters) dominates
 * over depth (quadratic credit spend per account).
 *
 * Formula per release:
 *   fanScore = uniqueVoters × UNIQUE_VOTER_WEIGHT + Σ√(costᵢ)
 *
 * Example: 100 sybil accounts × 1 credit each → 100×1000 + 100 = 100 100
 *          1 passionate fan × 144 credits     → 1×1000 + 12   = 1 012
 * Vote weight is multiplied by trust level (see /methodology).
 * Sybil still scales with account count — trust weights reduce disposable-email impact.
 */

export const UNIQUE_VOTER_WEIGHT = 1000;

export interface FanVoteInput {
  fanId: string;
  cost: number;
  /** Trust weight (0.1–1.25). Defaults to 1 for backwards-compatible tests. */
  trustWeight?: number;
}

export function calculateFanScore(votes: FanVoteInput[]): number {
  if (votes.length === 0) return 0;

  const voterWeights = new Map<string, number>();
  for (const vote of votes) {
    const weight = vote.trustWeight ?? 1;
    voterWeights.set(vote.fanId, Math.max(voterWeights.get(vote.fanId) ?? 0, weight));
  }

  const weightedUniqueVoters = [...voterWeights.values()].reduce((sum, w) => sum + w, 0);
  const sqrtCostSum = votes.reduce(
    (sum, v) => sum + Math.sqrt(Math.max(0, v.cost ?? 0)) * (v.trustWeight ?? 1),
    0
  );

  return weightedUniqueVoters * UNIQUE_VOTER_WEIGHT + sqrtCostSum;
}

export function calculateCommunityPowerPercent(
  releaseFanScore: number,
  totalFanScore: number
): number {
  if (totalFanScore <= 0) return 0;
  return Math.round((releaseFanScore / totalFanScore) * 100);
}