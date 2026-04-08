import { artistManagementService } from './artistManagementService';

interface SyncJobStatus {
  lastRun: number;
  nextRun: number;
  isRunning: boolean;
  lastRunSuccess: boolean;
  lastRunDuration: number;
  artistsSynced: number;
  errorCount: number;
  errorMessages: string[];
}

interface SyncSettings {
  enabled: boolean;
  syncTime: string;
  syncInterval: number;
  maxRetries: number;
  batchSize: number;
  delayBetweenArtists: number;
}

class NightlySyncService {
  private syncTimer: number | null = null;
  private isRunning = false;

  private readonly DEFAULT_SETTINGS: SyncSettings = {
    enabled: true,
    syncTime: '02:00',
    syncInterval: 24 * 60 * 60 * 1000,
    maxRetries: 3,
    batchSize: 5,
    delayBetweenArtists: 2000,
  };

  async initialize(): Promise<void> {
    const settings = await this.getSettings();
    if (settings.enabled) {
      await this.scheduleNextSync();
    }
  }

  async getSettings(): Promise<SyncSettings> {
    const saved = await spark.kv.get<SyncSettings>('nightly-sync-settings');
    return saved || this.DEFAULT_SETTINGS;
  }

  async updateSettings(settings: Partial<SyncSettings>): Promise<SyncSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await spark.kv.set('nightly-sync-settings', updated);
    
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (updated.enabled) {
      await this.scheduleNextSync();
    }
    
    return updated;
  }

  async getStatus(): Promise<SyncJobStatus> {
    const status = await spark.kv.get<SyncJobStatus>('nightly-sync-status');
    if (!status) {
      return {
        lastRun: 0,
        nextRun: 0,
        isRunning: false,
        lastRunSuccess: false,
        lastRunDuration: 0,
        artistsSynced: 0,
        errorCount: 0,
        errorMessages: [],
      };
    }
    return status;
  }

  private async updateStatus(update: Partial<SyncJobStatus>): Promise<void> {
    const current = await this.getStatus();
    const updated = { ...current, ...update };
    await spark.kv.set('nightly-sync-status', updated);
  }

  private async scheduleNextSync(): Promise<void> {
    const settings = await this.getSettings();
    const now = new Date();
    const nextSync = this.calculateNextSyncTime(settings.syncTime);
    const delay = nextSync.getTime() - now.getTime();

    await this.updateStatus({ nextRun: nextSync.getTime() });

    if (delay > 0) {
      this.syncTimer = window.setTimeout(async () => {
        await this.runSync();
      }, delay);
    } else {
      await this.runSync();
    }
  }

  private calculateNextSyncTime(syncTime: string): Date {
    const [hours, minutes] = syncTime.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  async runSync(force = false): Promise<void> {
    if (this.isRunning && !force) {
      console.log('Sync already running, skipping...');
      return;
    }

    const settings = await this.getSettings();
    if (!settings.enabled && !force) {
      console.log('Sync disabled, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    await this.updateStatus({
      isRunning: true,
      lastRun: startTime,
      errorCount: 0,
      errorMessages: [],
      artistsSynced: 0,
    });

    try {
      console.log('🌙 Starting nightly sync job...');
      
      const artists = await artistManagementService.getAllArtists();
      console.log(`Found ${artists.length} artists to sync`);

      let successCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];

      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        
        try {
          console.log(`Syncing ${i + 1}/${artists.length}: ${artist.name}`);
          await artistManagementService.syncArtistReleases(artist.id);
          successCount++;
          
          await this.updateStatus({ artistsSynced: successCount });

          if (i < artists.length - 1) {
            await new Promise(resolve => 
              setTimeout(resolve, settings.delayBetweenArtists)
            );
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to sync ${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errorMessages.push(errorMsg);
          
          await this.updateStatus({ 
            errorCount,
            errorMessages: errorMessages.slice(-10),
          });
        }
      }

      const duration = Date.now() - startTime;
      const success = errorCount === 0;

      await this.updateStatus({
        isRunning: false,
        lastRunSuccess: success,
        lastRunDuration: duration,
        artistsSynced: successCount,
        errorCount,
        errorMessages: errorMessages.slice(-10),
      });

      console.log(`✅ Nightly sync completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Synced: ${successCount}, Errors: ${errorCount}`);

      await this.scheduleNextSync();
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateStatus({
        isRunning: false,
        lastRunSuccess: false,
        lastRunDuration: duration,
        errorCount: 1,
        errorMessages: [errorMsg],
      });

      console.error('❌ Nightly sync failed:', error);
      
      await this.scheduleNextSync();
    } finally {
      this.isRunning = false;
    }
  }

  async runManualSync(): Promise<void> {
    console.log('🔄 Starting manual sync...');
    await this.runSync(true);
  }

  async stop(): Promise<void> {
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    
    await this.updateSettings({ enabled: false });
    console.log('Nightly sync stopped');
  }

  async start(): Promise<void> {
    await this.updateSettings({ enabled: true });
    await this.scheduleNextSync();
    console.log('Nightly sync started');
  }

  async formatNextRunTime(): Promise<string> {
    const status = await this.getStatus();
    if (status.nextRun === 0) {
      return 'Nicht geplant / Not scheduled';
    }
    
    const nextRun = new Date(status.nextRun);
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Überfällig / Overdue';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `In ${hours}h ${minutes}m`;
  }

  async getSyncHistory(): Promise<{
    date: number;
    success: boolean;
    duration: number;
    artistsSynced: number;
    errorCount: number;
  }[]> {
    const history = await spark.kv.get<any[]>('nightly-sync-history') || [];
    return history.slice(-30);
  }

  private async addToHistory(): Promise<void> {
    const status = await this.getStatus();
    const history = await this.getSyncHistory();
    
    history.push({
      date: status.lastRun,
      success: status.lastRunSuccess,
      duration: status.lastRunDuration,
      artistsSynced: status.artistsSynced,
      errorCount: status.errorCount,
    });
    
    await spark.kv.set('nightly-sync-history', history.slice(-30));
  }
}

export const nightlySyncService = new NightlySyncService();
