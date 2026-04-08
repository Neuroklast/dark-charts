import { StreamingMetrics, StreamingScore, StreamingChartResult } from '../models/StreamingMetrics';
import { IArtistRepository } from '../repositories/IArtistRepository';
import { prisma } from '../lib/prisma';
import { isSpotifyConfigured, getArtistStreamingData } from '../../../api/_lib/spotify';

/**
 * Streaming chart calculation service.
 *
 * When Spotify credentials are configured, fetches live data from the Spotify
 * Web API and persists weekly snapshots in the database. Growth is calculated
 * by comparing the current snapshot with the previous week's snapshot.
 *
 * When Spotify is not configured, falls back to stored snapshots only (returns
 * empty results if no snapshots exist).
 */
export class StreamingChartCalculationService {
  constructor(private artistRepository: IArtistRepository) {}

  async calculateStreamingCharts(): Promise<StreamingChartResult[]> {
    const artists = await this.artistRepository.findAll();

    const metricsPromises = artists.map(artist => this.getStreamingMetricsForArtist(artist.id));
    const allMetrics = await Promise.all(metricsPromises);

    const validMetrics = allMetrics.filter((m): m is StreamingMetrics => m !== null);

    const scores = validMetrics.map(metrics => this.calculateScore(metrics));

    const sortedResults = scores
      .sort((a, b) => b.score - a.score)
      .map((scoreData, index) => {
        const metrics = validMetrics.find(m => m.artistId === scoreData.artistId);
        if (!metrics) {
          throw new Error(`Metrics not found for artist ${scoreData.artistId}`);
        }

        return {
          artistId: scoreData.artistId,
          artistName: metrics.artistName,
          position: index + 1,
          score: scoreData.score,
          totalStreams: metrics.totalStreams,
          followerCount: metrics.followerCount,
          weeklyGrowth: metrics.weeklyGrowthPercentage,
          engagementRatio: scoreData.engagementRatio
        };
      });

    return sortedResults;
  }

  calculateScore(metrics: StreamingMetrics): StreamingScore {
    const logarithmicScore = this.calculateLogarithmicScore(metrics.totalStreams);

    const growthFactor = this.calculateGrowthFactor(metrics.weeklyGrowthPercentage);

    const engagementRatio = this.calculateEngagementRatio(
      metrics.totalStreams,
      metrics.followerCount
    );

    const finalScore = logarithmicScore * growthFactor * (1 + engagementRatio);

    return {
      artistId: metrics.artistId,
      score: finalScore,
      logarithmicScore,
      growthFactor,
      engagementRatio
    };
  }

  calculateLogarithmicScore(totalStreams: number): number {
    if (totalStreams <= 0) {
      return 0;
    }

    const baseScore = Math.log10(totalStreams + 1);

    const normalizedScore = baseScore * 100;

    return Math.max(0, normalizedScore);
  }

  calculateGrowthFactor(weeklyGrowthPercentage: number): number {
    if (weeklyGrowthPercentage < 0) {
      const decayFactor = 1 + (weeklyGrowthPercentage / 100);
      return Math.max(0.5, decayFactor);
    }

    if (weeklyGrowthPercentage === 0) {
      return 1.0;
    }

    const growthBonus = 1 + Math.log10(weeklyGrowthPercentage + 1) / 10;

    const cappedBonus = Math.min(3.0, growthBonus);

    return cappedBonus;
  }

  calculateEngagementRatio(totalStreams: number, followerCount: number): number {
    if (followerCount === 0) {
      return totalStreams > 0 ? 2.0 : 0;
    }

    const rawRatio = totalStreams / followerCount;

    const normalizedRatio = Math.log10(rawRatio + 1) / 2;

    const cappedRatio = Math.min(2.0, normalizedRatio);

    return cappedRatio;
  }

  private async getStreamingMetricsForArtist(artistId: string): Promise<StreamingMetrics | null> {
    try {
      const artist = await prisma.artist.findUnique({ where: { id: artistId } });
      if (!artist?.spotifyId) return null;

      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      // Try to fetch fresh data from Spotify if configured
      if (isSpotifyConfigured()) {
        try {
          const spotifyData = await getArtistStreamingData(artist.spotifyId);

          // Spotify popularity (0-100) approximates relative streaming volume.
          // Scale it to make the logarithmic score meaningful.
          const estimatedStreams = Math.round(Math.pow(10, spotifyData.popularity / 20));

          await prisma.streamingSnapshot.upsert({
            where: {
              artistId_weekStart: { artistId, weekStart: currentWeekStart },
            },
            update: {
              spotifyPopularity: spotifyData.popularity,
              followerCount: spotifyData.followerCount,
              topTrackPopularity: spotifyData.topTrackAvgPopularity,
            },
            create: {
              artistId,
              spotifyPopularity: spotifyData.popularity,
              followerCount: spotifyData.followerCount,
              topTrackPopularity: spotifyData.topTrackAvgPopularity,
              weekStart: currentWeekStart,
            },
          });

          const previousSnapshot = await prisma.streamingSnapshot.findUnique({
            where: {
              artistId_weekStart: { artistId, weekStart: previousWeekStart },
            },
          });

          const previousStreams = previousSnapshot
            ? Math.round(Math.pow(10, previousSnapshot.spotifyPopularity / 20))
            : estimatedStreams;

          const weeklyGrowth = this.calculateWeeklyGrowth(estimatedStreams, previousStreams);

          return {
            artistId,
            artistName: artist.name,
            totalStreams: estimatedStreams,
            followerCount: spotifyData.followerCount,
            weeklyGrowthPercentage: weeklyGrowth,
            previousWeekStreams: previousStreams,
          };
        } catch (error) {
          console.error(`Spotify API error for artist ${artistId}, falling back to stored data:`, error);
        }
      }

      // Fallback: use stored snapshots
      const currentSnapshot = await prisma.streamingSnapshot.findUnique({
        where: { artistId_weekStart: { artistId, weekStart: currentWeekStart } },
      });

      if (!currentSnapshot) return null;

      const previousSnapshot = await prisma.streamingSnapshot.findUnique({
        where: { artistId_weekStart: { artistId, weekStart: previousWeekStart } },
      });

      const currentStreams = Math.round(Math.pow(10, currentSnapshot.spotifyPopularity / 20));
      const previousStreams = previousSnapshot
        ? Math.round(Math.pow(10, previousSnapshot.spotifyPopularity / 20))
        : currentStreams;

      const weeklyGrowth = this.calculateWeeklyGrowth(currentStreams, previousStreams);

      return {
        artistId,
        artistName: artist.name,
        totalStreams: currentStreams,
        followerCount: currentSnapshot.followerCount,
        weeklyGrowthPercentage: weeklyGrowth,
        previousWeekStreams: previousStreams,
      };
    } catch (error) {
      console.error(`Failed to fetch metrics for artist ${artistId}:`, error);
      return null;
    }
  }

  private calculateWeeklyGrowth(currentStreams: number, previousStreams: number): number {
    if (previousStreams === 0) {
      return currentStreams > 0 ? 100 : 0;
    }

    const growth = ((currentStreams - previousStreams) / previousStreams) * 100;
    return growth;
  }
}
