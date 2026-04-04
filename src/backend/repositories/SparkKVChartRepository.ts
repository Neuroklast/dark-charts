import { IChartRepository } from './IChartRepository';
import { ChartEntry, ChartType, CreateChartEntryDTO, UpdateChartEntryDTO, ChartPosition } from '../models/ChartEntry';

export class SparkKVChartRepository implements IChartRepository {
  private readonly CHARTS_KEY = 'cms:charts';
  private readonly CHART_PREFIX = 'cms:chart:';

  async findByChartType(chartType: ChartType, weekNumber: number, year: number): Promise<ChartEntry[]> {
    const all = await this.findAll();
    return all.filter(entry => 
      entry.chartType === chartType &&
      entry.weekNumber === weekNumber &&
      entry.year === year
    );
  }

  async findByTrackId(trackId: string): Promise<ChartEntry[]> {
    const all = await this.findAll();
    return all.filter(entry => entry.trackId === trackId);
  }

  async findByArtistId(artistId: string, chartType?: ChartType): Promise<ChartEntry[]> {
    const all = await this.findAll();
    return all.filter(entry => 
      entry.artistId === artistId &&
      (chartType === undefined || entry.chartType === chartType)
    );
  }

  async findCurrentWeek(chartType: ChartType): Promise<ChartEntry[]> {
    const { weekNumber, year } = this.getCurrentWeekInfo();
    return this.findByChartType(chartType, weekNumber, year);
  }

  async findTopN(chartType: ChartType, n: number, weekNumber: number, year: number): Promise<ChartEntry[]> {
    const entries = await this.findByChartType(chartType, weekNumber, year);
    return entries
      .sort((a, b) => a.position - b.position)
      .slice(0, n);
  }

  async create(dto: CreateChartEntryDTO): Promise<ChartEntry> {
    const id = this.generateId();
    const now = new Date();
    
    const entry: ChartEntry = {
      id,
      trackId: dto.trackId,
      artistId: dto.artistId,
      chartType: dto.chartType,
      position: dto.position,
      previousPosition: dto.previousPosition || null,
      weeksInChart: dto.weeksInChart || 1,
      votes: dto.votes,
      score: dto.score,
      weekNumber: dto.weekNumber,
      year: dto.year,
      createdAt: now,
      updatedAt: now
    };

    const key = `${this.CHART_PREFIX}${id}`;
    await window.spark.kv.set(key, entry);

    const all = await this.findAll();
    all.push(entry);
    await window.spark.kv.set(this.CHARTS_KEY, all);

    return entry;
  }

  async update(id: string, dto: UpdateChartEntryDTO): Promise<ChartEntry | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updated: ChartEntry = {
      ...existing,
      ...dto,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };

    const key = `${this.CHART_PREFIX}${id}`;
    await window.spark.kv.set(key, updated);

    const all = await this.findAll();
    const index = all.findIndex(e => e.id === id);
    if (index >= 0) {
      all[index] = updated;
      await window.spark.kv.set(this.CHARTS_KEY, all);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const key = `${this.CHART_PREFIX}${id}`;
    await window.spark.kv.delete(key);

    const all = await this.findAll();
    const filtered = all.filter(e => e.id !== id);
    await window.spark.kv.set(this.CHARTS_KEY, filtered);

    return true;
  }

  async getTrackPositions(trackId: string, weekNumber: number, year: number): Promise<ChartPosition[]> {
    const all = await this.findAll();
    const entries = all.filter(entry => 
      entry.trackId === trackId &&
      entry.weekNumber === weekNumber &&
      entry.year === year
    );

    return entries.map(entry => ({
      chartType: entry.chartType,
      position: entry.position,
      previousPosition: entry.previousPosition,
      weeksInChart: entry.weeksInChart
    }));
  }

  async getWeekHistory(chartType: ChartType, trackId: string, numberOfWeeks: number): Promise<ChartEntry[]> {
    const all = await this.findAll();
    return all
      .filter(entry => 
        entry.chartType === chartType &&
        entry.trackId === trackId
      )
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.weekNumber - a.weekNumber;
      })
      .slice(0, numberOfWeeks);
  }

  private async findAll(): Promise<ChartEntry[]> {
    const entries = await window.spark.kv.get<ChartEntry[]>(this.CHARTS_KEY);
    return entries || [];
  }

  private async findById(id: string): Promise<ChartEntry | null> {
    const key = `${this.CHART_PREFIX}${id}`;
    const entry = await window.spark.kv.get<ChartEntry>(key);
    return entry || null;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentWeekInfo(): { weekNumber: number; year: number } {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    
    return {
      weekNumber,
      year: now.getFullYear()
    };
  }
}
