import { IDataService, Track, ChartData, ChartWeights } from '@/types';
import { generateComprehensiveCharts } from './comprehensiveData';
import { rankToPoints, calculateConsensusBonus, calculateTotalScore } from '@/lib/math/borda';

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

  calculateOverallChart(): Track[] {
    this.initialize();

    const FIXED_WEIGHTS: ChartWeights = { fan: 50, expert: 35, streaming: 15 };

    const allTracks = new Map<string, {
      track: Track;
      fanRank?: number;
      expertRank?: number;
      streamingRank?: number;
    }>();

    this.fanCharts.forEach((track, index) => {
      const key = `${track.artist}-${track.title}`;
      if (!allTracks.has(key)) {
        allTracks.set(key, { track: { ...track, chartType: 'overall' }, fanRank: index + 1 });
      } else {
        allTracks.get(key)!.fanRank = index + 1;
      }
    });

    this.expertCharts.forEach((track, index) => {
      const key = `${track.artist}-${track.title}`;
      if (!allTracks.has(key)) {
        allTracks.set(key, { track: { ...track, chartType: 'overall' }, expertRank: index + 1 });
      } else {
        allTracks.get(key)!.expertRank = index + 1;
      }
    });

    this.streamingCharts.forEach((track, index) => {
      const key = `${track.artist}-${track.title}`;
      if (!allTracks.has(key)) {
        allTracks.set(key, { track: { ...track, chartType: 'overall' }, streamingRank: index + 1 });
      } else {
        allTracks.get(key)!.streamingRank = index + 1;
      }
    });

    const tracksWithScores = Array.from(allTracks.values()).map(({ track, fanRank, expertRank, streamingRank }) => {
      const poolsPresent = [fanRank, expertRank, streamingRank].filter(r => r !== undefined).length;
      const bonus = calculateConsensusBonus(poolsPresent);

      const fanPoints = fanRank !== undefined ? rankToPoints(fanRank, this.fanCharts.length) : 0;
      const expertPoints = expertRank !== undefined ? rankToPoints(expertRank, this.expertCharts.length) : 0;
      const streamingPoints = streamingRank !== undefined ? rankToPoints(streamingRank, this.streamingCharts.length) : 0;

      const overallScore = calculateTotalScore(fanPoints, expertPoints, streamingPoints, FIXED_WEIGHTS) * bonus;

      return { ...track, overallScore, movement: 0 };
    });

    const sorted = tracksWithScores.sort((a, b) => b.overallScore - a.overallScore);

    return sorted.map((track, index) => ({
      ...track,
      rank: index + 1,
      chartType: 'overall'
    }));
  }

  async vote(trackId: string, credits: number): Promise<void> {
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
