import { Track, ChartWeights, ChartData } from '@/types';
import { mockFanCharts, mockExpertCharts, mockStreamingCharts } from './mockData';
import { calculateOverallChart, normalizeWeights } from '@/lib/math/normalization';

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
    return calculateOverallChart(mockFanCharts, mockExpertCharts, mockStreamingCharts, weights);
  }

  static normalizeWeights(weights: ChartWeights): ChartWeights {
    return normalizeWeights(weights);
  }

  private static simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 150));
  }
}
