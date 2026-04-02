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
