import { ChartEntry, ChartType, CreateChartEntryDTO, UpdateChartEntryDTO, ChartPosition } from '../models/ChartEntry';

export interface IChartRepository {
  findByChartType(chartType: ChartType, weekNumber: number, year: number): Promise<ChartEntry[]>;
  
  findByTrackId(trackId: string): Promise<ChartEntry[]>;
  
  findByArtistId(artistId: string, chartType?: ChartType): Promise<ChartEntry[]>;
  
  findCurrentWeek(chartType: ChartType): Promise<ChartEntry[]>;
  
  findTopN(chartType: ChartType, n: number, weekNumber: number, year: number): Promise<ChartEntry[]>;
  
  create(dto: CreateChartEntryDTO): Promise<ChartEntry>;
  
  update(id: string, dto: UpdateChartEntryDTO): Promise<ChartEntry | null>;
  
  delete(id: string): Promise<boolean>;
  
  getTrackPositions(trackId: string, weekNumber: number, year: number): Promise<ChartPosition[]>;
  
  getWeekHistory(chartType: ChartType, trackId: string, numberOfWeeks: number): Promise<ChartEntry[]>;
}
