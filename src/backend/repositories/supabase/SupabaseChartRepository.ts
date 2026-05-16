import { supabase } from '@/lib/supabase/client'
import { IChartRepository } from '../IChartRepository'
import { ChartEntry, ChartPosition, ChartType, CreateChartEntryDTO, UpdateChartEntryDTO } from '../../models/ChartEntry'

const getWeekStartDate = (weekNumber: number, year: number): Date => {
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = januaryFourth.getUTCDay() || 7
  const firstWeekStart = new Date(januaryFourth)
  firstWeekStart.setUTCDate(januaryFourth.getUTCDate() - dayOfWeek + 1)
  const weekStart = new Date(firstWeekStart)
  weekStart.setUTCDate(firstWeekStart.getUTCDate() + (weekNumber - 1) * 7)
  weekStart.setUTCHours(0, 0, 0, 0)
  return weekStart
}

const getCurrentWeekInfo = (): { weekNumber: number; year: number; weekStart: Date } => {
  const now = new Date()
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const weekNumber = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7)
  const year = target.getUTCFullYear()
  return { weekNumber, year, weekStart: getWeekStartDate(weekNumber, year) }
}

const toDomain = (row: any): ChartEntry => ({
  id: row.id,
  trackId: row.trackId ?? row.releaseId ?? '',
  artistId: row.artistId ?? '',
  chartType: row.chartType,
  position: row.placement,
  previousPosition: row.movement ? row.placement + row.movement : null,
  weeksInChart: 1,
  votes: Math.round(row.fanScore ?? 0),
  score: row.score ?? 0,
  weekNumber: row.weekNumber ?? getCurrentWeekInfo().weekNumber,
  year: row.year ?? getCurrentWeekInfo().year,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.createdAt),
})

export class SupabaseChartRepository implements IChartRepository {
  async findByChartType(chartType: ChartType, weekNumber: number, year: number): Promise<ChartEntry[]> {
    const weekStart = getWeekStartDate(weekNumber, year).toISOString()
    const { data, error } = await supabase
      .from('chart_entries')
      .select('*')
      .eq('chartType', chartType)
      .eq('weekStart', weekStart)
      .order('placement')

    if (error) {
      throw new Error(`Failed to fetch chart entries by chart type: ${error.message}`)
    }

    return (data ?? []).map(toDomain)
  }

  async findByTrackId(trackId: string): Promise<ChartEntry[]> {
    const { data, error } = await supabase.from('chart_entries').select('*').eq('trackId', trackId).order('createdAt', { ascending: false })
    if (error) {
      throw new Error(`Failed to fetch chart entries by track id: ${error.message}`)
    }
    return (data ?? []).map(toDomain)
  }

  async findByArtistId(artistId: string, chartType?: ChartType): Promise<ChartEntry[]> {
    let query = supabase.from('chart_entries').select('*').eq('artistId', artistId)
    if (chartType) {
      query = query.eq('chartType', chartType)
    }
    const { data, error } = await query.order('weekStart', { ascending: false }).order('placement')
    if (error) {
      throw new Error(`Failed to fetch chart entries by artist id: ${error.message}`)
    }
    return (data ?? []).map(toDomain)
  }

  async findCurrentWeek(chartType: ChartType): Promise<ChartEntry[]> {
    const { weekNumber, year } = getCurrentWeekInfo()
    return this.findByChartType(chartType, weekNumber, year)
  }

  async findTopN(chartType: ChartType, n: number, weekNumber: number, year: number): Promise<ChartEntry[]> {
    const entries = await this.findByChartType(chartType, weekNumber, year)
    return entries.slice(0, n)
  }

  async create(dto: CreateChartEntryDTO): Promise<ChartEntry> {
    const weekStart = getWeekStartDate(dto.weekNumber, dto.year)
    const movement = dto.previousPosition != null ? dto.previousPosition - dto.position : 0
    const payload = {
      trackId: dto.trackId,
      artistId: dto.artistId,
      chartType: dto.chartType,
      placement: dto.position,
      score: dto.score,
      fanScore: dto.votes,
      expertScore: 0,
      communityPower: 0,
      weekStart: weekStart.toISOString(),
      movement,
      weekNumber: dto.weekNumber,
      year: dto.year,
    }

    const { data, error } = await supabase.from('chart_entries').insert(payload).select().single()
    if (error) {
      throw new Error(`Failed to create chart entry: ${error.message}`)
    }
    return toDomain(data)
  }

  async update(id: string, dto: UpdateChartEntryDTO): Promise<ChartEntry | null> {
    const payload: Record<string, unknown> = {}
    if (dto.position !== undefined) payload.placement = dto.position
    if (dto.score !== undefined) payload.score = dto.score
    if (dto.votes !== undefined) payload.fanScore = dto.votes
    if (dto.previousPosition !== undefined && dto.position !== undefined) {
      payload.movement = dto.previousPosition === null ? 0 : dto.previousPosition - dto.position
    }

    const { data, error } = await supabase.from('chart_entries').update(payload).eq('id', id).select().maybeSingle()
    if (error) {
      throw new Error(`Failed to update chart entry: ${error.message}`)
    }
    return data ? toDomain(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('chart_entries').delete().eq('id', id)
    return !error
  }

  async getTrackPositions(trackId: string, weekNumber: number, year: number): Promise<ChartPosition[]> {
    const entries = await this.findByChartType('fan', weekNumber, year)
    return entries
      .filter((entry) => entry.trackId === trackId)
      .map((entry) => ({
        chartType: entry.chartType,
        position: entry.position,
        previousPosition: entry.previousPosition,
        weeksInChart: entry.weeksInChart,
      }))
  }

  async getWeekHistory(chartType: ChartType, trackId: string, numberOfWeeks: number): Promise<ChartEntry[]> {
    const { data, error } = await supabase
      .from('chart_entries')
      .select('*')
      .eq('chartType', chartType)
      .eq('trackId', trackId)
      .order('weekStart', { ascending: false })
      .limit(numberOfWeeks)

    if (error) {
      throw new Error(`Failed to fetch chart history: ${error.message}`)
    }

    return (data ?? []).map(toDomain)
  }
}
