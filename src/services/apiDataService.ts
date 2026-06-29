import { ChartData, Genre, IDataService, Track } from '@/types';
import { ComprehensiveDataService } from './comprehensiveDataService';
import { logger } from '@/lib/logger';

type ChartApiEntry = {
  id: string;
  placement: number;
  movement: number | null;
  communityPower: number | null;
  release?: {
    id: string;
    title: string;
    spotifyId: string | null;
    itunesArtworkUrl: string | null;
    vercelBlobUrl: string | null;
    artist?: {
      name: string;
      genres: string[] | null;
      imageUrl: string | null;
    } | null;
  } | null;
};

function mapEntryToTrack(
  entry: ChartApiEntry,
  chartType: 'fan' | 'expert' | 'streaming' | 'overall'
): Track {
  const movement = entry.movement ?? 0;
  return {
    id: entry.release?.id || entry.id,
    rank: entry.placement,
    artist: entry.release?.artist?.name || 'Unknown Artist',
    title: entry.release?.title || 'Unknown Title',
    genres: (entry.release?.artist?.genres || []) as Genre[],
    movement,
    chartType,
    albumArt:
      entry.release?.itunesArtworkUrl ||
      entry.release?.vercelBlobUrl ||
      entry.release?.artist?.imageUrl ||
      undefined,
    spotifyUri: entry.release?.spotifyId ? `spotify:track:${entry.release.spotifyId}` : undefined,
    community_power: entry.communityPower ?? undefined,
    trend_direction: movement > 0 ? 'up' : movement < 0 ? 'down' : 'stable',
    weeksInChart: 1,
    votes: 0,
  };
}

async function fetchChartType(
  type: 'fan' | 'expert' | 'streaming' | 'combined'
): Promise<Track[]> {
  const res = await fetch(`/api/charts?type=${type}&completed=true&limit=50`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.success || !Array.isArray(data.entries) || data.entries.length === 0) {
    return [];
  }
  const chartType = type === 'combined' ? 'overall' : type;
  return data.entries.map((entry: ChartApiEntry) => mapEntryToTrack(entry, chartType));
}

export class ApiDataService implements IDataService {
  private fallback = new ComprehensiveDataService();
  private fanCharts: Track[] = [];
  private expertCharts: Track[] = [];
  private combinedCharts: Track[] = [];
  /** True when live API returned empty and mock data is shown. */
  isUsingMockData = false;

  private cacheCharts(data: ChartData) {
    this.fanCharts = data.fanCharts;
    this.expertCharts = data.expertCharts;
    this.combinedCharts = data.combinedCharts ?? [];
  }

  async getAllCharts(): Promise<ChartData> {
    try {
      const [fanCharts, expertCharts, combinedCharts] = await Promise.all([
        fetchChartType('fan'),
        fetchChartType('expert'),
        fetchChartType('combined'),
      ]);

      const hasApiData =
        fanCharts.length > 0 ||
        expertCharts.length > 0 ||
        combinedCharts.length > 0;

      if (hasApiData) {
        this.isUsingMockData = false;
        const data = { fanCharts, expertCharts, streamingCharts: [], combinedCharts };
        this.cacheCharts(data);
        return data;
      }

      logger.warn('API charts empty — falling back to mock data');
      this.isUsingMockData = true;
      const data = await this.fallback.getAllCharts();
      this.cacheCharts(data);
      return data;
    } catch (error) {
      logger.error('Failed to fetch charts from API, using mock fallback', { error });
      this.isUsingMockData = true;
      const data = await this.fallback.getAllCharts();
      this.cacheCharts(data);
      return data;
    }
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    const tracks = await fetchChartType(type);
    if (tracks.length > 0) return tracks;
    return this.fallback.getChartByType(type);
  }

  calculateOverallChart(): Track[] {
    if (this.combinedCharts.length > 0) {
      return this.combinedCharts;
    }

    if (this.fanCharts.length === 0 && this.expertCharts.length === 0) {
      return this.fallback.calculateOverallChart();
    }

    logger.warn('Combined chart empty — falling back to client-side Borda merge');
    return this.fallback.calculateOverallChart();
  }

  async vote(_trackId: string, _direction: 'up' | 'down'): Promise<void> {
    logger.warn('Legacy up/down voting is deprecated; use quadratic voting at /voting');
  }

  async getVotes(_trackId: string): Promise<number> {
    return 0;
  }

  async getUserVotesForTrack(_trackId: string): Promise<number> {
    return 0;
  }

  getNextChartPublicationDate(): Date {
    return this.fallback.getNextChartPublicationDate();
  }
}