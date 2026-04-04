export type ChartType = 'fan' | 'expert' | 'streaming';

export interface ChartEntry {
  id: string;
  trackId: string;
  artistId: string;
  chartType: ChartType;
  position: number;
  previousPosition: number | null;
  weeksInChart: number;
  votes: number;
  score: number;
  weekNumber: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChartEntryDTO {
  trackId: string;
  artistId: string;
  chartType: ChartType;
  position: number;
  previousPosition?: number | null;
  weeksInChart?: number;
  votes: number;
  score: number;
  weekNumber: number;
  year: number;
}

export interface UpdateChartEntryDTO {
  position?: number;
  previousPosition?: number | null;
  weeksInChart?: number;
  votes?: number;
  score?: number;
}

export interface ChartPosition {
  chartType: ChartType;
  position: number;
  previousPosition: number | null;
  weeksInChart: number;
}
