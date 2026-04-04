import { IChartRepository } from '../repositories/IChartRepository';
import { ChartEntry, ChartType, CreateChartEntryDTO, UpdateChartEntryDTO, ChartPosition } from '../models/ChartEntry';

export class ChartService {
  constructor(private chartRepository: IChartRepository) {}

  async getChartByType(chartType: ChartType, weekNumber: number, year: number): Promise<ChartEntry[]> {
    this.validateChartType(chartType);
    this.validateWeekInfo(weekNumber, year);
    
    const entries = await this.chartRepository.findByChartType(chartType, weekNumber, year);
    return entries.sort((a, b) => a.position - b.position);
  }

  async getCurrentWeekChart(chartType: ChartType): Promise<ChartEntry[]> {
    this.validateChartType(chartType);
    
    const entries = await this.chartRepository.findCurrentWeek(chartType);
    return entries.sort((a, b) => a.position - b.position);
  }

  async getTopNTracks(chartType: ChartType, n: number, weekNumber: number, year: number): Promise<ChartEntry[]> {
    this.validateChartType(chartType);
    this.validateWeekInfo(weekNumber, year);

    if (n < 1 || n > 100) {
      throw new Error('N must be between 1 and 100');
    }

    return this.chartRepository.findTopN(chartType, n, weekNumber, year);
  }

  async getTrackPositions(trackId: string, weekNumber: number, year: number): Promise<ChartPosition[]> {
    if (!trackId || trackId.trim() === '') {
      throw new Error('Track ID is required');
    }

    this.validateWeekInfo(weekNumber, year);

    return this.chartRepository.getTrackPositions(trackId, weekNumber, year);
  }

  async getTrackHistory(chartType: ChartType, trackId: string, numberOfWeeks: number): Promise<ChartEntry[]> {
    this.validateChartType(chartType);

    if (!trackId || trackId.trim() === '') {
      throw new Error('Track ID is required');
    }

    if (numberOfWeeks < 1 || numberOfWeeks > 52) {
      throw new Error('Number of weeks must be between 1 and 52');
    }

    return this.chartRepository.getWeekHistory(chartType, trackId, numberOfWeeks);
  }

  async createChartEntry(dto: CreateChartEntryDTO): Promise<ChartEntry> {
    this.validateCreateChartEntryDTO(dto);

    return this.chartRepository.create(dto);
  }

  async updateChartEntry(id: string, dto: UpdateChartEntryDTO): Promise<ChartEntry | null> {
    if (!id || id.trim() === '') {
      throw new Error('Chart entry ID is required');
    }

    return this.chartRepository.update(id, dto);
  }

  async deleteChartEntry(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Chart entry ID is required');
    }

    return this.chartRepository.delete(id);
  }

  async getArtistChartHistory(artistId: string, chartType?: ChartType): Promise<ChartEntry[]> {
    if (!artistId || artistId.trim() === '') {
      throw new Error('Artist ID is required');
    }

    if (chartType) {
      this.validateChartType(chartType);
    }

    const entries = await this.chartRepository.findByArtistId(artistId, chartType);
    return entries.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
      return a.position - b.position;
    });
  }

  private validateChartType(chartType: ChartType): void {
    const validTypes: ChartType[] = ['fan', 'expert', 'streaming'];
    if (!validTypes.includes(chartType)) {
      throw new Error(`Invalid chart type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  private validateWeekInfo(weekNumber: number, year: number): void {
    if (weekNumber < 1 || weekNumber > 53) {
      throw new Error('Week number must be between 1 and 53');
    }

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear) {
      throw new Error(`Year must be between 2020 and ${currentYear}`);
    }
  }

  private validateCreateChartEntryDTO(dto: CreateChartEntryDTO): void {
    this.validateChartType(dto.chartType);
    this.validateWeekInfo(dto.weekNumber, dto.year);

    if (!dto.trackId || dto.trackId.trim() === '') {
      throw new Error('Track ID is required');
    }

    if (!dto.artistId || dto.artistId.trim() === '') {
      throw new Error('Artist ID is required');
    }

    if (dto.position < 1 || dto.position > 100) {
      throw new Error('Position must be between 1 and 100');
    }

    if (dto.votes < 0) {
      throw new Error('Votes cannot be negative');
    }

    if (dto.score < 0) {
      throw new Error('Score cannot be negative');
    }
  }
}
