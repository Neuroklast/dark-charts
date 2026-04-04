import { IDataService, Track, ChartData, ChartWeights } from '@/types';
import { mockFanCharts, mockExpertCharts, mockStreamingCharts } from './mockData';
import { useKV } from '@github/spark/hooks';

export class MockDataService implements IDataService {
  private voteStore = new Map<string, number>();
  private userVotes = new Map<string, 'up' | 'down'>();

  async getAllCharts(): Promise<ChartData> {
    await this.simulateNetworkDelay();
    
    return {
      fanCharts: await this.injectVotes(mockFanCharts),
      expertCharts: await this.injectVotes(mockExpertCharts),
      streamingCharts: await this.injectVotes(mockStreamingCharts)
    };
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    await this.simulateNetworkDelay();
    
    const data = {
      fan: mockFanCharts,
      expert: mockExpertCharts,
      streaming: mockStreamingCharts
    };
    
    return this.injectVotes(data[type]);
  }

  calculateOverallChart(weights: ChartWeights): Track[] {
    const normalizedWeights = this.normalizeWeights(weights);
    
    const allTracks = new Map<string, Track>();
    
    [...mockFanCharts, ...mockExpertCharts, ...mockStreamingCharts].forEach(track => {
      const key = `${track.artist}-${track.title}`;
      
      if (!allTracks.has(key)) {
        allTracks.set(key, {
          ...track,
          chartType: 'overall'
        });
      }
    });

    const tracksWithScores = Array.from(allTracks.values()).map(track => {
      const fanScore = track.fanScore || 0;
      const expertScore = track.expertScore || 0;
      const streamingScore = track.streamingScore || 0;
      
      const overallScore = 
        (fanScore * normalizedWeights.fan) +
        (expertScore * normalizedWeights.expert) +
        (streamingScore * normalizedWeights.streaming);
      
      return {
        ...track,
        overallScore,
        movement: 0
      };
    });

    const sorted = tracksWithScores.sort((a, b) => b.overallScore - a.overallScore);
    
    return sorted.map((track, index) => ({
      ...track,
      rank: index + 1,
      chartType: 'overall',
      votes: this.voteStore.get(track.id) || track.votes || 0
    }));
  }

  async vote(trackId: string, direction: 'up' | 'down'): Promise<void> {
    await this.simulateNetworkDelay(50);
    
    const currentVote = this.userVotes.get(trackId);
    const currentVotes = this.voteStore.get(trackId) || 0;
    
    if (currentVote === direction) {
      this.userVotes.delete(trackId);
      this.voteStore.set(trackId, currentVotes + (direction === 'up' ? -1 : 1));
    } else if (currentVote) {
      this.userVotes.set(trackId, direction);
      this.voteStore.set(trackId, currentVotes + (direction === 'up' ? 2 : -2));
    } else {
      this.userVotes.set(trackId, direction);
      this.voteStore.set(trackId, currentVotes + (direction === 'up' ? 1 : -1));
    }
  }

  async getVotes(trackId: string): Promise<number> {
    const track = [...mockFanCharts, ...mockExpertCharts, ...mockStreamingCharts]
      .find(t => t.id === trackId);
    
    return this.voteStore.get(trackId) || track?.votes || 0;
  }

  async hasUserVoted(trackId: string): Promise<boolean> {
    return this.userVotes.has(trackId);
  }

  private normalizeWeights(weights: ChartWeights): ChartWeights {
    const total = weights.fan + weights.expert + weights.streaming;
    
    if (total === 0) {
      return { fan: 0.33, expert: 0.33, streaming: 0.34 };
    }
    
    return {
      fan: weights.fan / total,
      expert: weights.expert / total,
      streaming: weights.streaming / total
    };
  }

  private async injectVotes(tracks: Track[]): Promise<Track[]> {
    return tracks.map(track => ({
      ...track,
      votes: this.voteStore.get(track.id) || track.votes || 0
    }));
  }

  private simulateNetworkDelay(ms: number = 1800): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
