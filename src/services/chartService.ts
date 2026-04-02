import { Track, ChartWeights, ChartData } from '@/types';
import { mockFanCharts, mockExpertCharts, mockStreamingCharts } from './mockData';

export class ChartService {
  static async getAllCharts(): Promise<ChartData> {
    await this.simulateNetworkDelay();
    
    return {
      fanCharts: mockFanCharts,
      expertCharts: mockExpertCharts,
      streamingCharts: mockStreamingCharts
    };
  }

  static async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    await this.simulateNetworkDelay();
    
    switch (type) {
      case 'fan':
        return mockFanCharts;
      case 'expert':
        return mockExpertCharts;
      case 'streaming':
        return mockStreamingCharts;
      default:
        return [];
    }
  }

  static calculateOverallChart(weights: ChartWeights): Track[] {
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
      chartType: 'overall'
    }));
  }

  static normalizeWeights(weights: ChartWeights): ChartWeights {
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

  private static simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 150));
  }
}
