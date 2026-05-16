import { supabase } from '@/lib/supabase/client'
import { calculateExpertPoints } from '../../lib/math/expert-ranking';

export class ChartAggregationService {
  async aggregateChartsForWeek(weekStart: Date) {
    // Determine the end of the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Fetch all votes for the current week
    const { data: fanVotes, error: fanVotesError } = await supabase
      .from('votes')
      .select('*')
      .gte('createdAt', weekStart.toISOString())
      .lt('createdAt', weekEnd.toISOString())

    if (fanVotesError) {
      throw new Error(`Failed to fetch fan votes: ${fanVotesError.message}`)
    }

    const { data: expertVotes, error: expertVotesError } = await supabase
      .from('expert_votes')
      .select('*, dj_profiles(reputationScore)')
      .gte('createdAt', weekStart.toISOString())
      .lt('createdAt', weekEnd.toISOString())

    if (expertVotesError) {
      throw new Error(`Failed to fetch expert votes: ${expertVotesError.message}`)
    }

    // Fetch last week's chart to calculate movement
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const { data: lastWeekEntries, error: lastWeekEntriesError } = await supabase
      .from('chart_entries')
      .select('*')
      .eq('weekStart', lastWeekStart.toISOString())
      .eq('chartType', 'combined')

    if (lastWeekEntriesError) {
      throw new Error(`Failed to fetch last week chart entries: ${lastWeekEntriesError.message}`)
    }

    const lastWeekPlacements = new Map<string, number>();
    for (const entry of lastWeekEntries) {
      if (entry.releaseId) {
        lastWeekPlacements.set(entry.releaseId, entry.placement);
      }
    }

    // Aggregate metrics per release
    const releaseMetrics = new Map<string, { fanScore: number; expertScore: number }>();

    for (const vote of fanVotes ?? []) {
      const current = releaseMetrics.get(vote.releaseId) || { fanScore: 0, expertScore: 0 };
      current.fanScore += vote.allocatedVotes; // Aggregating allocated votes as fanScore
      releaseMetrics.set(vote.releaseId, current);
    }

    for (const expertVote of expertVotes ?? []) {
      const current = releaseMetrics.get(expertVote.releaseId) || { fanScore: 0, expertScore: 0 };
      const expertPoints = calculateExpertPoints(expertVote.rank, expertVote.dj_profiles?.reputationScore ?? 0);
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

      const { error: insertError } = await supabase.from('chart_entries').insert({
        releaseId: entry.releaseId,
        chartType: 'combined',
        weekStart: weekStart.toISOString(),
        placement: currentPlacement,
        score: entry.score,
        fanScore: entry.fanScore,
        expertScore: entry.expertScore,
        communityPower: 0,
        movement: movement,
      })

      if (insertError) {
        throw new Error(`Failed to create chart entry: ${insertError.message}`)
      }
    }

    return entries;
  }
}

export const chartAggregationService = new ChartAggregationService();
