import { IDataService, Track, ChartData, ChartWeights } from '@/types';
import { mockFanCharts, mockExpertCharts, mockStreamingCharts } from './mockData';
import { rankToPoints, calculateConsensusBonus, calculateTotalScore } from '@/lib/math/borda';

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

  calculateOverallChart(): Track[] {
    const FIXED_WEIGHTS: ChartWeights = { fan: 50, expert: 35, streaming: 15 };

    const allTracks = new Map<string, {
      track: Track;
      fanRank?: number;
      expertRank?: number;
      streamingRank?: number;
    }>();

    mockFanCharts.forEach((track, index) => {
      const key = `${track.artist}-${track.title}`;
      if (!allTracks.has(key)) {
        allTracks.set(key, { track: { ...track, chartType: 'overall' }, fanRank: index + 1 });
      } else {
        allTracks.get(key)!.fanRank = index + 1;
      }
    });

    mockExpertCharts.forEach((track, index) => {
      const key = `${track.artist}-${track.title}`;
      if (!allTracks.has(key)) {
        allTracks.set(key, { track: { ...track, chartType: 'overall' }, expertRank: index + 1 });
      } else {
        allTracks.get(key)!.expertRank = index + 1;
      }
    });

    mockStreamingCharts.forEach((track, index) => {
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

      const fanPoints = fanRank !== undefined ? rankToPoints(fanRank, mockFanCharts.length) : 0;
      const expertPoints = expertRank !== undefined ? rankToPoints(expertRank, mockExpertCharts.length) : 0;
      const streamingPoints = streamingRank !== undefined ? rankToPoints(streamingRank, mockStreamingCharts.length) : 0;

      const overallScore = calculateTotalScore(fanPoints, expertPoints, streamingPoints, FIXED_WEIGHTS) * bonus;

      return { ...track, overallScore, movement: 0 };
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

  async getUserVotesForTrack(trackId: string): Promise<number> {
    return this.voteStore.get(trackId) || 0;
  }

  getNextChartPublicationDate(): Date {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  }

  async hasUserVoted(trackId: string): Promise<boolean> {
    return this.userVotes.has(trackId);
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
