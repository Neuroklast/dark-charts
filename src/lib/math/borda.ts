import { ChartWeights } from '@/types';

/**
 * Converts a chart rank to Borda points.
 * Rank 1 = totalTracks points, rank totalTracks = 1 point.
 */
export function rankToPoints(rank: number, totalTracks: number = 100): number {
  return Math.max(0, totalTracks - rank + 1);
}

/**
 * Returns a consensus bonus multiplier.
 * Tracks present in 2 or more pools receive a 10% bonus.
 */
export function calculateConsensusBonus(poolsPresent: number): number {
  return poolsPresent >= 2 ? 1.1 : 1.0;
}

/**
 * Calculates the total weighted score for a track across all three pools.
 * Weights are treated as relative ratios and normalised internally.
 */
export function calculateTotalScore(
  fanPoints: number,
  expertPoints: number,
  streamingPoints: number,
  fixedWeights: ChartWeights
): number {
  const total = fixedWeights.fan + fixedWeights.expert + fixedWeights.streaming;
  if (total === 0) {
    return (fanPoints + expertPoints + streamingPoints) / 3;
  }
  return (
    (fanPoints * fixedWeights.fan +
      expertPoints * fixedWeights.expert +
      streamingPoints * fixedWeights.streaming) /
    total
  );
}
