import { IDataService, Track, ChartData, ChartWeights } from '@/types';
import { generateComprehensiveCharts } from './comprehensiveData';

export class ComprehensiveDataService implements IDataService {
  private fanCharts: Track[] = [];
  private expertCharts: Track[] = [];
  private streamingCharts: Track[] = [];
  private initialized = false;

  private initialize() {
    if (this.initialized) return;
    
    const charts = generateComprehensiveCharts();
    this.fanCharts = charts.fanCharts;
    this.expertCharts = charts.expertCharts;
    this.streamingCharts = charts.streamingCharts;
    this.initialized = true;
  }

  async getAllCharts(): Promise<ChartData> {
    this.initialize();
    await this.simulateNetworkDelay();
    
    const voteData = await this.loadVoteData();
    
    return {
      fanCharts: this.injectVotes(this.fanCharts, voteData),
      expertCharts: this.injectVotes(this.expertCharts, voteData),
      streamingCharts: this.injectVotes(this.streamingCharts, voteData)
    };
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    this.initialize();
    await this.simulateNetworkDelay();
    
    const voteData = await this.loadVoteData();
    const data = {
      fan: this.fanCharts,
      expert: this.expertCharts,
      streaming: this.streamingCharts
    };
    
    return this.injectVotes(data[type], voteData);
  }

  calculateOverallChart(weights: ChartWeights): Track[] {
    this.initialize();
    const normalizedWeights = this.normalizeWeights(weights);
    
    const allTracks = new Map<string, Track>();
    
    [...this.fanCharts, ...this.expertCharts, ...this.streamingCharts].forEach(track => {
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
      chartType: 'overall'
    }));
  }

  async vote(trackId: string, direction: 'up' | 'down'): Promise<void> {
    await this.simulateNetworkDelay(50);
    
    const voteData = await this.loadVoteData();
    const userVotes = voteData.userVotes;
    const voteStore = voteData.voteStore;
    
    const currentVote = userVotes[trackId];
    const currentVotes = voteStore[trackId] || 0;
    
    if (currentVote === direction) {
      delete userVotes[trackId];
      voteStore[trackId] = currentVotes + (direction === 'up' ? -1 : 1);
    } else if (currentVote) {
      userVotes[trackId] = direction;
      voteStore[trackId] = currentVotes + (direction === 'up' ? 2 : -2);
    } else {
      userVotes[trackId] = direction;
      voteStore[trackId] = currentVotes + (direction === 'up' ? 1 : -1);
    }
    
    await this.saveVoteData(voteData);
  }

  async getVotes(trackId: string): Promise<number> {
    const voteData = await this.loadVoteData();
    const track = [...this.fanCharts, ...this.expertCharts, ...this.streamingCharts]
      .find(t => t.id === trackId);
    
    return voteData.voteStore[trackId] || track?.votes || 0;
  }

  async hasUserVoted(trackId: string): Promise<boolean> {
    const voteData = await this.loadVoteData();
    return trackId in voteData.userVotes;
  }

  async getUserVote(trackId: string): Promise<'up' | 'down' | null> {
    const voteData = await this.loadVoteData();
    return voteData.userVotes[trackId] || null;
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

  private injectVotes(tracks: Track[], voteData: VoteData): Track[] {
    return tracks.map(track => ({
      ...track,
      votes: voteData.voteStore[track.id] || track.votes || 0
    }));
  }

  private simulateNetworkDelay(ms: number = 150): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async loadVoteData(): Promise<VoteData> {
    try {
      const data = await window.spark.kv.get<VoteData>('chart-vote-data');
      return data || { voteStore: {}, userVotes: {} };
    } catch (error) {
      return { voteStore: {}, userVotes: {} };
    }
  }

  private async saveVoteData(data: VoteData): Promise<void> {
    await window.spark.kv.set('chart-vote-data', data);
  }
}

interface VoteData {
  voteStore: Record<string, number>;
  userVotes: Record<string, 'up' | 'down'>;
}
