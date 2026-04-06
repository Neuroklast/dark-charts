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

    // Fetch last week's chart to calculate movement
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEntries = await prisma.chartEntry.findMany({
      where: {
        weekStart: lastWeekStart,
        chartType: 'combined',
      },
    });

    const lastWeekPlacements = new Map<string, number>();
    for (const entry of lastWeekEntries) {
      if (entry.releaseId) {
        lastWeekPlacements.set(entry.releaseId, entry.placement);
      }
    }

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

    const entries = Array.from(releaseMetrics.entries()).map(([releaseId, metrics]) => {
      // Weighting: 50% Fans, 35% Experts
      const weightedScore = (metrics.fanScore * 0.5) + (metrics.expertScore * 0.35);

      return {
        releaseId,
        fanScore: metrics.fanScore,
        expertScore: metrics.expertScore,
        score: weightedScore,
      };
    });

    // Sort to assign placement based on weighted score
    entries.sort((a, b) => b.score - a.score);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const currentPlacement = i + 1;

      let movement = 0;
      const lastPlacement = lastWeekPlacements.get(entry.releaseId);
      if (lastPlacement !== undefined) {
        movement = lastPlacement - currentPlacement; // Positive means moved up
      } else {
        // If it wasn't in the chart last week, it's new. Movement could be considered 0 or positive.
        // The prompt says "Speichere den Trend als Integer im Feld movement ab. Positiv für Aufsteiger und negativ für Absteiger."
        movement = 0;
      }

      await prisma.chartEntry.create({
        data: {
          releaseId: entry.releaseId,
          chartType: 'combined',
          weekStart: weekStart,
          placement: currentPlacement,
          score: entry.score,
          fanScore: entry.fanScore,
          expertScore: entry.expertScore,
          communityPower: 0,
          movement: movement,
        },
      });
    }

    return entries;
  }
}

export const chartAggregationService = new ChartAggregationService();
