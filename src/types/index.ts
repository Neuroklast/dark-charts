export type Genre = 'Dark Wave' | 'EBM' | 'Death Metal' | 'Black Metal' | 'Gothic Rock' | 'Industrial' | 'Doom Metal' | 'Darkwave' | 'Synthwave';

export type ChartType = 'fan' | 'expert' | 'streaming' | 'overall';

export interface Track {
  id: string;
  rank: number;
  artist: string;
  title: string;
  genres: Genre[];
  movement?: number;
  previousRank?: number;
  chartType: ChartType;
  fanScore?: number;
  expertScore?: number;
  streamingScore?: number;
  albumArt?: string;
  spotifyUri?: string;
  votes?: number;
}

export interface ChartWeights {
  fan: number;
  expert: number;
  streaming: number;
}

export interface ChartData {
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
}

export interface Vote {
  trackId: string;
  direction: 'up' | 'down';
  timestamp: number;
}

export interface IDataService {
  getAllCharts(): Promise<ChartData>;
  getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]>;
  calculateOverallChart(weights: ChartWeights): Track[];
  vote(trackId: string, direction: 'up' | 'down'): Promise<void>;
  getVotes(trackId: string): Promise<number>;
  hasUserVoted(trackId: string): Promise<boolean>;
}

export interface IAuthService {
  getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null>;
  ensureSession(): Promise<void>;
}
