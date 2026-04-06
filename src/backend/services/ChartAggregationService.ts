import { prisma } from '../lib/prisma';
import { calculateExpertPoints } from '../../lib/math/expert-ranking';

export class ChartAggregationService {
  async aggregateChartsForWeek(weekStart: Date) {
    // Determine the end of the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Fetch all votes for the current week
    const fanVotes = await prisma.vote.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    const expertVotes = await prisma.expertVote.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: {
        dj: true,
      },
    });

    // Aggregate metrics per release
    const releaseMetrics = new Map<string, { fanScore: number; expertScore: number }>();

    for (const vote of fanVotes) {
      const current = releaseMetrics.get(vote.releaseId) || { fanScore: 0, expertScore: 0 };
      current.fanScore += vote.allocatedVotes; // Aggregating allocated votes as fanScore
      releaseMetrics.set(vote.releaseId, current);
    }

    for (const expertVote of expertVotes) {
      const current = releaseMetrics.get(expertVote.releaseId) || { fanScore: 0, expertScore: 0 };
      const expertPoints = calculateExpertPoints(expertVote.rank, expertVote.dj.reputationScore);
      current.expertScore += expertPoints;
      releaseMetrics.set(expertVote.releaseId, current);
    }

    // Sort to determine placements (based on a combined logic, or just saving the raw scores.
    // The prompt says "Er aggregiert die Metriken in das Modell 'ChartEntry' mit separaten Feldern für 'fanScore' und 'expertScore', um die spätere prozentuale Gewichtung im Frontend zu ermöglichen.")
    // Let's create or update ChartEntry for each release in 'combined' chartType as an example,
    // or maybe 'fan' and 'expert' separately? The prompt says "isolierten Voting-Engine für Fan- und Experten-Charts",
    // "aggregiert die Metriken in das Modell 'ChartEntry' mit separaten Feldern". I will write a generic combined entry.

    const entries = Array.from(releaseMetrics.entries()).map(([releaseId, metrics]) => ({
      releaseId,
      fanScore: metrics.fanScore,
      expertScore: metrics.expertScore,
      // For placement, we could sort by a simple sum for now, since frontend will do the weighting,
      // or we can sort by fanScore for 'fan' chart, expertScore for 'expert' chart.
      // I'll create one generic 'combined' chart entry for simplicity as the prompt implies a single entry with both scores.
      score: metrics.fanScore + metrics.expertScore,
    }));

    // Sort to assign placement
    entries.sort((a, b) => b.score - a.score);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      await prisma.chartEntry.create({
        data: {
          releaseId: entry.releaseId,
          chartType: 'combined',
          weekStart: weekStart,
          placement: i + 1,
          score: entry.score,
          fanScore: entry.fanScore,
          expertScore: entry.expertScore,
          communityPower: 0,
        },
      });
    }

    return entries;
  }
}

export const chartAggregationService = new ChartAggregationService();
