import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { calculateExpertPoints } from '@/lib/math/expert-ranking';
import {
  calculateFanScore,
  calculateCommunityPowerPercent,
} from '@/lib/math/fan-scoring';
import { getTrustWeight } from '@/lib/trust-level';
import { buildGenreChartInserts } from '@/lib/genre-aggregation';
import { getSystemSettings } from '@/lib/api/systemSettings';
import { getWeekEnd, getPreviousWeekStart, getIsoWeekYear } from '@/lib/week';

type ChartTypeKey = 'fan' | 'expert' | 'streaming' | 'combined';

interface ReleaseMetrics {
  fanScore: number;
  expertScore: number;
  streamingScore: number;
}

interface ChartEntryInsert {
  releaseId: string;
  chartType: ChartTypeKey;
  genre?: string | null;
  weekStart: string;
  placement: number;
  score: number;
  fanScore: number;
  expertScore: number;
  communityPower: number;
  movement: number;
  weekNumber: number;
  year: number;
}

function calculateStreamingScore(
  current: { spotifyPopularity: number; followerCount: number },
  previous: { spotifyPopularity: number; followerCount: number } | null
): number {
  const estimatedStreams = Math.round(Math.pow(10, current.spotifyPopularity / 20));
  const previousStreams = previous
    ? Math.round(Math.pow(10, previous.spotifyPopularity / 20))
    : estimatedStreams;

  const logScore =
    estimatedStreams <= 0 ? 0 : Math.log10(estimatedStreams + 1) * 100;

  let growthFactor = 1.0;
  if (previousStreams > 0) {
    const growth = ((estimatedStreams - previousStreams) / previousStreams) * 100;
    if (growth < 0) {
      growthFactor = Math.max(0.5, 1 + growth / 100);
    } else if (growth > 0) {
      growthFactor = Math.min(3.0, 1 + Math.log10(growth + 1) / 10);
    }
  }

  const followerCount = current.followerCount;
  let engagementRatio = 0;
  if (followerCount === 0) {
    engagementRatio = estimatedStreams > 0 ? 2.0 : 0;
  } else {
    engagementRatio = Math.min(
      2.0,
      Math.log10(estimatedStreams / followerCount + 1) / 2
    );
  }

  return logScore * growthFactor * (1 + engagementRatio);
}

function normalizeScore(value: number, max: number): number {
  if (max <= 0) return 0;
  return value / max;
}

export class ChartAggregationService {
  async aggregateChartsForWeek(weekStart: Date) {
    const supabase = createServiceRoleSupabaseClient();
    const weekEnd = getWeekEnd(weekStart);
    const lastWeekStart = getPreviousWeekStart(weekStart);
    const { weekNumber, year } = getIsoWeekYear(weekStart);
    const settings = await getSystemSettings(supabase);
    const weights = settings.chartWeights;

    const weekStartIso = weekStart.toISOString();
    const lastWeekStartIso = lastWeekStart.toISOString();

    await supabase.from('chart_entries').delete().eq('weekStart', weekStartIso);

    const { data: fanVotes, error: fanVotesError } = await supabase
      .from('votes')
      .select('*')
      .gte('createdAt', weekStartIso)
      .lt('createdAt', weekEnd.toISOString());

    if (fanVotesError) {
      throw new Error(`Failed to fetch fan votes: ${fanVotesError.message}`);
    }

    const { data: expertVotes, error: expertVotesError } = await supabase
      .from('expert_votes')
      .select('*, dj:dj_profiles(reputationScore, expertStatus)')
      .gte('createdAt', weekStartIso)
      .lt('createdAt', weekEnd.toISOString());

    if (expertVotesError) {
      throw new Error(`Failed to fetch expert votes: ${expertVotesError.message}`);
    }

    const { data: snapshots, error: snapshotsError } = await supabase
      .from('streaming_snapshots')
      .select('*')
      .eq('weekStart', weekStartIso);

    if (snapshotsError) {
      throw new Error(`Failed to fetch streaming snapshots: ${snapshotsError.message}`);
    }

    const { data: prevSnapshots } = await supabase
      .from('streaming_snapshots')
      .select('*')
      .eq('weekStart', lastWeekStartIso);

    const prevSnapshotByArtist = new Map(
      (prevSnapshots ?? []).map((s) => [s.artistId, s])
    );

    const artistIds = (snapshots ?? []).map((s) => s.artistId);
    const { data: releases } = artistIds.length
      ? await supabase
          .from('releases')
          .select('id, artistId, releaseDate')
          .eq('isVisible', true)
          .in('artistId', artistIds)
      : { data: [] };

    const artistToRelease = new Map<string, string>();
    for (const release of releases ?? []) {
      const existingId = artistToRelease.get(release.artistId);
      if (!existingId) {
        artistToRelease.set(release.artistId, release.id);
        continue;
      }
      const existing = (releases ?? []).find((r) => r.id === existingId);
      if (
        existing &&
        new Date(release.releaseDate) > new Date(existing.releaseDate)
      ) {
        artistToRelease.set(release.artistId, release.id);
      }
    }

    const releaseMetrics = new Map<string, ReleaseMetrics>();

    const ensureMetrics = (releaseId: string): ReleaseMetrics => {
      const current = releaseMetrics.get(releaseId);
      if (current) return current;
      const fresh = { fanScore: 0, expertScore: 0, streamingScore: 0 };
      releaseMetrics.set(releaseId, fresh);
      return fresh;
    };

    const fanIds = [...new Set((fanVotes ?? []).map((v) => v.fanId))];
    const trustWeightByFanId = new Map<string, number>();

    if (fanIds.length > 0) {
      const { data: fanProfiles } = await supabase
        .from('fan_profiles')
        .select('id, userId')
        .in('id', fanIds);

      const userIds = [...new Set((fanProfiles ?? []).map((p) => p.userId))];
      const trustByUserId = new Map<string, number>();

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, trustLevel')
          .in('id', userIds);

        for (const user of users ?? []) {
          trustByUserId.set(user.id, getTrustWeight(user.trustLevel));
        }
      }

      for (const profile of fanProfiles ?? []) {
        trustWeightByFanId.set(
          profile.id,
          trustByUserId.get(profile.userId) ?? getTrustWeight(0)
        );
      }
    }

    const fanVotesByRelease = new Map<
      string,
      { fanId: string; cost: number; trustWeight: number }[]
    >();
    const fanVoteCountByRelease = new Map<string, number>();

    for (const vote of fanVotes ?? []) {
      const list = fanVotesByRelease.get(vote.releaseId) ?? [];
      list.push({
        fanId: vote.fanId,
        cost: vote.cost ?? 0,
        trustWeight: trustWeightByFanId.get(vote.fanId) ?? getTrustWeight(0),
      });
      fanVotesByRelease.set(vote.releaseId, list);
      fanVoteCountByRelease.set(
        vote.releaseId,
        (fanVoteCountByRelease.get(vote.releaseId) ?? 0) + 1
      );
    }

    for (const [releaseId, votes] of fanVotesByRelease) {
      const metrics = ensureMetrics(releaseId);
      metrics.fanScore = calculateFanScore(votes);
    }

    for (const expertVote of expertVotes ?? []) {
      const dj = expertVote.dj as
        | { reputationScore: number; expertStatus: boolean }
        | null
        | undefined;
      if (!dj?.expertStatus) continue;

      const reputation = Math.max(1, Number(dj.reputationScore ?? 1));
      const metrics = ensureMetrics(expertVote.releaseId);
      metrics.expertScore += calculateExpertPoints(expertVote.rank, reputation);
    }

    for (const snapshot of snapshots ?? []) {
      const releaseId = artistToRelease.get(snapshot.artistId);
      if (!releaseId) continue;

      const prev = prevSnapshotByArtist.get(snapshot.artistId) ?? null;
      const score = calculateStreamingScore(snapshot, prev);
      const metrics = ensureMetrics(releaseId);
      metrics.streamingScore = Math.max(metrics.streamingScore, score);
    }

    const allReleaseIds = Array.from(releaseMetrics.keys());
    if (allReleaseIds.length === 0) {
      await this.resetFanCredits(supabase, settings.voiceCreditsBudget);
      return [];
    }

    const maxFan = Math.max(...allReleaseIds.map((id) => releaseMetrics.get(id)!.fanScore), 1);
    const maxExpert = Math.max(
      ...allReleaseIds.map((id) => releaseMetrics.get(id)!.expertScore),
      1
    );
    const maxStreaming = Math.max(
      ...allReleaseIds.map((id) => releaseMetrics.get(id)!.streamingScore),
      1
    );

    const totalFanScore = allReleaseIds.reduce(
      (sum, id) => sum + releaseMetrics.get(id)!.fanScore,
      0
    );

    const combinedScores = allReleaseIds.map((releaseId) => {
      const m = releaseMetrics.get(releaseId)!;
      const weightedScore =
        normalizeScore(m.fanScore, maxFan) * weights.fan +
        normalizeScore(m.expertScore, maxExpert) * weights.expert +
        normalizeScore(m.streamingScore, maxStreaming) * weights.streaming;

      const communityPower = calculateCommunityPowerPercent(m.fanScore, totalFanScore);

      return { releaseId, ...m, weightedScore, communityPower };
    });

    const chartTypes: ChartTypeKey[] = ['fan', 'expert', 'streaming', 'combined'];
    const lastWeekPlacements = new Map<ChartTypeKey, Map<string, number>>();

    for (const chartType of chartTypes) {
      const { data: lastWeekEntries } = await supabase
        .from('chart_entries')
        .select('releaseId, placement')
        .eq('weekStart', lastWeekStartIso)
        .eq('chartType', chartType);

      const placements = new Map<string, number>();
      for (const entry of lastWeekEntries ?? []) {
        if (entry.releaseId) {
          placements.set(entry.releaseId, entry.placement);
        }
      }
      lastWeekPlacements.set(chartType, placements);
    }

    const inserts: ChartEntryInsert[] = [];

    const buildEntries = (
      chartType: ChartTypeKey,
      scoreFn: (item: (typeof combinedScores)[0]) => number
    ) => {
      const sorted = [...combinedScores].sort((a, b) => scoreFn(b) - scoreFn(a));
      const placements = lastWeekPlacements.get(chartType)!;

      sorted.forEach((item, index) => {
        const placement = index + 1;
        const lastPlacement = placements.get(item.releaseId);
        const movement =
          lastPlacement !== undefined ? lastPlacement - placement : 0;

        inserts.push({
          releaseId: item.releaseId,
          chartType,
          genre: null,
          weekStart: weekStartIso,
          placement,
          score: scoreFn(item),
          fanScore: item.fanScore,
          expertScore: item.expertScore,
          communityPower: chartType === 'combined' ? item.communityPower : 0,
          movement,
          weekNumber,
          year,
        });
      });
    };

    buildEntries('fan', (i) => i.fanScore);
    buildEntries('expert', (i) => i.expertScore);
    buildEntries('streaming', (i) => i.streamingScore);
    buildEntries('combined', (i) => i.weightedScore);

    const { data: releaseGenreRows } = await supabase
      .from('releases')
      .select('id, genres, artist:artists(genres)')
      .in('id', allReleaseIds)
      .eq('isVisible', true);

    const releaseGenreMap = new Map<
      string,
      { releaseGenres: string[]; artistGenres: string[] }
    >();
    for (const row of releaseGenreRows ?? []) {
      const artist = row.artist as { genres?: string[] } | null;
      releaseGenreMap.set(row.id, {
        releaseGenres: row.genres ?? [],
        artistGenres: artist?.genres ?? [],
      });
    }

    const genreInserts = buildGenreChartInserts({
      combinedScores,
      releaseGenreMap,
      fanVoteCountByRelease,
      weekStartIso,
      weekNumber,
      year,
    });
    inserts.push(...genreInserts);

    const { error: insertError } = await supabase.from('chart_entries').insert(inserts);
    if (insertError) {
      throw new Error(`Failed to create chart entries: ${insertError.message}`);
    }

    await this.resetFanCredits(supabase, settings.voiceCreditsBudget);

    return combinedScores;
  }

  private async resetFanCredits(
    supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
    budget: number
  ) {
    const { error } = await supabase
      .from('fan_profiles')
      .update({ remainingCredits: budget, updatedAt: new Date().toISOString() });

    if (error) {
      throw new Error(`Failed to reset fan credits: ${error.message}`);
    }
  }
}

export const chartAggregationService = new ChartAggregationService();