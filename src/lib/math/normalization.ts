import { ChartWeights, Track } from '@/types';

/** Renormalize fan + expert weights; streaming is ignored in the hybrid chart. */
export function normalizeHybridWeights(weights: ChartWeights): { fan: number; expert: number } {
  const fan = Math.max(0, weights.fan);
  const expert = Math.max(0, weights.expert);
  const total = fan + expert;

  if (total <= 0) {
    return { fan: 0.55, expert: 0.45 };
  }

  return { fan: fan / total, expert: expert / total };
}

export function normalizeWeights(weights: ChartWeights): ChartWeights {
  const hybrid = normalizeHybridWeights(weights);
  return { fan: hybrid.fan, expert: hybrid.expert, streaming: 0 };
}

export function calculateTotalWeight(weights: ChartWeights): number {
  return weights.fan + weights.expert;
}

export function formatHybridWeightsPercent(weights: ChartWeights): { fan: number; expert: number } {
  const hybrid = normalizeHybridWeights(weights);
  return {
    fan: Math.round(hybrid.fan * 100),
    expert: Math.round(hybrid.expert * 100),
  };
}

export function calculateOverallChart(
  fanCharts: Track[],
  expertCharts: Track[],
  weights: ChartWeights
): Track[] {
  const { fan: wFan, expert: wExpert } = normalizeHybridWeights(weights);

  const allTracks = new Map<string, Track>();

  [...fanCharts, ...expertCharts].forEach((track) => {
    const key = `${track.artist}-${track.title}`;
    if (!allTracks.has(key)) {
      allTracks.set(key, { ...track, chartType: 'overall' });
    }
  });

  const tracksWithScores = Array.from(allTracks.values()).map((track) => {
    const fanScore = track.fanScore || 0;
    const expertScore = track.expertScore || 0;
    const overallScore = fanScore * wFan + expertScore * wExpert;

    return {
      ...track,
      overallScore,
      movement: 0,
    };
  });

  const sorted = tracksWithScores.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  return sorted.map((track, index) => ({
    ...track,
    rank: index + 1,
    chartType: 'overall' as const,
  }));
}