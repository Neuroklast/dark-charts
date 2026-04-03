import { Track, ChartSnapshot, TrackHistory, ChartType, WeeklyMovement } from '@/types';

class ChartHistoryService {
  private readonly STORAGE_KEY = 'chart-history-snapshots';
  private readonly MAX_WEEKS = 12;

  async getSnapshots(): Promise<ChartSnapshot[]> {
    const stored = await spark.kv.get<ChartSnapshot[]>(this.STORAGE_KEY);
    return stored || this.generateMockHistory();
  }

  async saveSnapshot(fanCharts: Track[], expertCharts: Track[], streamingCharts: Track[]): Promise<void> {
    const snapshots = await this.getSnapshots();
    
    const newSnapshot: ChartSnapshot = {
      week: snapshots.length > 0 ? snapshots[0].week + 1 : 1,
      date: Date.now(),
      fanCharts: this.normalizeTracksForSnapshot(fanCharts),
      expertCharts: this.normalizeTracksForSnapshot(expertCharts),
      streamingCharts: this.normalizeTracksForSnapshot(streamingCharts)
    };

    const updatedSnapshots = [newSnapshot, ...snapshots].slice(0, this.MAX_WEEKS);
    await spark.kv.set(this.STORAGE_KEY, updatedSnapshots);
  }

  private normalizeTracksForSnapshot(tracks: Track[]): Track[] {
    return tracks.slice(0, 10).map((track, index) => ({
      ...track,
      rank: index + 1,
      previousRank: track.rank,
      movement: 0
    }));
  }

  async getTrackHistory(trackId: string): Promise<TrackHistory | null> {
    const snapshots = await this.getSnapshots();
    
    const history: TrackHistory['history'] = [];
    
    for (const snapshot of snapshots) {
      const allCharts = [
        { tracks: snapshot.fanCharts, type: 'fan' as ChartType },
        { tracks: snapshot.expertCharts, type: 'expert' as ChartType },
        { tracks: snapshot.streamingCharts, type: 'streaming' as ChartType }
      ];

      for (const { tracks, type } of allCharts) {
        const trackIndex = tracks.findIndex(t => t.id === trackId);
        if (trackIndex !== -1 && trackIndex < 10) {
          const track = tracks[trackIndex];
          const rank = trackIndex + 1;
          const prevEntry = history.find(h => h.chartType === type && h.week === snapshot.week - 1);
          const movement = prevEntry ? prevEntry.rank - rank : 0;
          
          history.push({
            week: snapshot.week,
            date: snapshot.date,
            rank,
            chartType: type,
            movement
          });
        }
      }
    }

    if (history.length === 0) return null;

    const firstEntry = snapshots[snapshots.length - 1].fanCharts[0] || 
                       snapshots[snapshots.length - 1].expertCharts[0] ||
                       snapshots[snapshots.length - 1].streamingCharts[0];

    return {
      trackId,
      artist: firstEntry?.artist || '',
      title: firstEntry?.title || '',
      history: history.sort((a, b) => b.week - a.week)
    };
  }

  async getWeeklyMovement(chartType: ChartType = 'fan'): Promise<WeeklyMovement | null> {
    const snapshots = await this.getSnapshots();
    if (snapshots.length < 2) return null;

    const currentWeek = snapshots[0];
    const previousWeek = snapshots[1];

    const currentTracks = this.getChartByType(currentWeek, chartType);
    const previousTracks = this.getChartByType(previousWeek, chartType);

    const movers = {
      biggest: [] as Track[],
      risers: [] as Track[],
      fallers: [] as Track[],
      newEntries: [] as Track[],
      reEntries: [] as Track[]
    };

    currentTracks.forEach((track, currentIndex) => {
      const previousIndex = previousTracks.findIndex(t => t.id === track.id);
      const currentRank = currentIndex + 1;
      
      if (previousIndex === -1) {
        const wasInOlderCharts = snapshots.slice(2).some(snapshot => {
          const olderTracks = this.getChartByType(snapshot, chartType);
          return olderTracks.some(t => t.id === track.id);
        });

        if (wasInOlderCharts) {
          movers.reEntries.push({ ...track, rank: currentRank, movement: 999 });
        } else {
          movers.newEntries.push({ ...track, rank: currentRank, movement: 999 });
        }
      } else {
        const previousRank = previousIndex + 1;
        const movement = previousRank - currentRank;
        
        if (movement > 0) {
          movers.risers.push({ ...track, rank: currentRank, movement, previousRank });
        } else if (movement < 0) {
          movers.fallers.push({ ...track, rank: currentRank, movement, previousRank });
        }
      }
    });

    movers.risers.sort((a, b) => (b.movement || 0) - (a.movement || 0));
    movers.fallers.sort((a, b) => (a.movement || 0) - (b.movement || 0));
    movers.biggest = [...movers.risers.slice(0, 5), ...movers.fallers.slice(0, 3)];

    return {
      week: currentWeek.week,
      date: currentWeek.date,
      movers
    };
  }

  private getChartByType(snapshot: ChartSnapshot, type: ChartType): Track[] {
    switch (type) {
      case 'fan':
        return snapshot.fanCharts;
      case 'expert':
        return snapshot.expertCharts;
      case 'streaming':
        return snapshot.streamingCharts;
      default:
        return snapshot.fanCharts;
    }
  }

  private generateMockHistory(): ChartSnapshot[] {
    const baseDate = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    return [];
  }

  async getAllTrackHistories(currentCharts: Track[]): Promise<Map<string, TrackHistory>> {
    const historyMap = new Map<string, TrackHistory>();
    
    for (const track of currentCharts) {
      const history = await this.getTrackHistory(track.id);
      if (history) {
        historyMap.set(track.id, history);
      }
    }
    
    return historyMap;
  }

  async getNextPublicationDate(): Promise<Date> {
    const snapshots = await this.getSnapshots();
    
    if (snapshots.length === 0) {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);
      return nextMonday;
    }

    const lastPublish = new Date(snapshots[0].date);
    const nextPublish = new Date(lastPublish);
    nextPublish.setDate(nextPublish.getDate() + 7);
    
    return nextPublish;
  }
}

export const chartHistoryService = new ChartHistoryService();
