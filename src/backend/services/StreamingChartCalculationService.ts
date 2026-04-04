import { StreamingMetrics, StreamingScore, StreamingChartResult } from '../models/StreamingMetrics';
import { IArtistRepository } from '../repositories/IArtistRepository';

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

  private calculateScore(metrics: StreamingMetrics): StreamingScore {
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

  private calculateLogarithmicScore(totalStreams: number): number {
    if (totalStreams <= 0) {
      return 0;
    }
    
    const baseScore = Math.log10(totalStreams + 1);
    
    const normalizedScore = baseScore * 100;
    
    return Math.max(0, normalizedScore);
  }

  private calculateGrowthFactor(weeklyGrowthPercentage: number): number {
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

  private calculateEngagementRatio(totalStreams: number, followerCount: number): number {
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
      const currentStreams = await this.fetchCurrentWeekStreams(artistId);
      const previousStreams = await this.fetchPreviousWeekStreams(artistId);
      const followers = await this.fetchFollowerCount(artistId);
      const artistName = await this.fetchArtistName(artistId);
      
      if (currentStreams === null || previousStreams === null || followers === null) {
        return null;
      }
      
      const weeklyGrowth = this.calculateWeeklyGrowth(currentStreams, previousStreams);
      
      return {
        artistId,
        artistName: artistName || 'Unknown Artist',
        totalStreams: currentStreams,
        followerCount: followers,
        weeklyGrowthPercentage: weeklyGrowth,
        previousWeekStreams: previousStreams
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

  private async fetchCurrentWeekStreams(artistId: string): Promise<number | null> {
    return null;
  }

  private async fetchPreviousWeekStreams(artistId: string): Promise<number | null> {
    return null;
  }

  private async fetchFollowerCount(artistId: string): Promise<number | null> {
    return null;
  }

  private async fetchArtistName(artistId: string): Promise<string | null> {
    try {
      const artist = await this.artistRepository.findById(artistId);
      return artist?.name || null;
    } catch {
      return null;
    }
  }
}
