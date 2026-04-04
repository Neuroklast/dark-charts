import { ReleaseImportService, ImportResult } from './ReleaseImportService';

interface CronJobConfig {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

type ScheduledTask = () => Promise<void>;

export class ReleaseImportScheduler {
  private intervalId: number | null = null;
  private importService: ReleaseImportService;
  private readonly SCHEDULER_CONFIG_KEY = 'backend:scheduler:config';
  private readonly LAST_RUN_KEY = 'backend:scheduler:last_run';

  constructor(importService: ReleaseImportService) {
    this.importService = importService;
  }

  async initialize(): Promise<void> {
    try {
      const schedule = this.getScheduleFromEnv();
      
      if (!schedule) {
        console.log('Release import scheduler: No schedule configured. Set VITE_RELEASE_IMPORT_CRON to enable.');
        return;
      }

      const config: CronJobConfig = {
        name: 'release-import',
        schedule,
        enabled: true,
        lastRun: await this.getLastRunTime(),
        nextRun: this.calculateNextRun(schedule)
      };

      await spark.kv.set(this.SCHEDULER_CONFIG_KEY, config);
      
      this.start(schedule);
      
      console.log(`Release import scheduler initialized. Next run: ${config.nextRun?.toISOString()}`);
    } catch (error) {
      console.error('Error initializing release import scheduler:', error);
    }
  }

  private getScheduleFromEnv(): string | null {
    const schedule = import.meta.env.VITE_RELEASE_IMPORT_CRON || '';
    
    if (!schedule) {
      return null;
    }

    if (!this.isValidCronExpression(schedule)) {
      console.warn(`Invalid cron expression: ${schedule}. Using default daily schedule.`);
      return '0 2 * * *';
    }

    return schedule;
  }

  private isValidCronExpression(expression: string): boolean {
    const parts = expression.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      return false;
    }

    const validPart = (part: string, min: number, max: number): boolean => {
      if (part === '*') return true;
      if (part.includes(',')) {
        return part.split(',').every(p => validPart(p.trim(), min, max));
      }
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return !isNaN(start) && !isNaN(end) && start >= min && end <= max;
      }
      if (part.includes('/')) {
        const [range, step] = part.split('/');
        const stepNum = Number(step);
        return !isNaN(stepNum) && validPart(range, min, max);
      }
      const num = Number(part);
      return !isNaN(num) && num >= min && num <= max;
    };

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    return validPart(minute, 0, 59) &&
           validPart(hour, 0, 23) &&
           validPart(dayOfMonth, 1, 31) &&
           validPart(month, 1, 12) &&
           validPart(dayOfWeek, 0, 6);
  }

  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    const [minute, hour] = cronExpression.split(/\s+/).map(part => {
      if (part === '*') return -1;
      return parseInt(part, 10);
    });

    const nextRun = new Date(now);
    
    if (hour !== -1) {
      nextRun.setHours(hour);
    }
    if (minute !== -1) {
      nextRun.setMinutes(minute);
    }
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  private async getLastRunTime(): Promise<Date | undefined> {
    try {
      const lastRun = await spark.kv.get<string>(this.LAST_RUN_KEY);
      return lastRun ? new Date(lastRun) : undefined;
    } catch (error) {
      console.error('Error retrieving last run time:', error);
      return undefined;
    }
  }

  private async setLastRunTime(date: Date): Promise<void> {
    try {
      await spark.kv.set(this.LAST_RUN_KEY, date.toISOString());
    } catch (error) {
      console.error('Error setting last run time:', error);
    }
  }

  private start(cronExpression: string): void {
    this.stop();

    const checkInterval = 60 * 1000;

    this.intervalId = window.setInterval(async () => {
      const now = new Date();
      const nextRun = this.calculateNextRun(cronExpression);
      
      if (now >= nextRun) {
        await this.executeJob();
      }
    }, checkInterval);

    console.log(`Scheduler started with cron expression: ${cronExpression}`);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Release import scheduler stopped');
    }
  }

  private async executeJob(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting scheduled release import...`);
    
    try {
      const sinceDate = new Date();
      sinceDate.setMonth(sinceDate.getMonth() - 1);

      const result: ImportResult = await this.importService.importNewReleases({
        sinceDate,
        maxReleasesPerArtist: 20
      });

      await this.setLastRunTime(new Date());

      console.log(`[${new Date().toISOString()}] Scheduled release import completed:`, {
        artistsProcessed: result.totalArtistsProcessed,
        releasesImported: result.totalReleasesImported,
        duplicatesSkipped: result.skippedDuplicates,
        errors: result.errors.length
      });

      if (result.errors.length > 0) {
        console.warn('Errors during import:', result.errors.slice(0, 10));
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Fatal error in scheduled release import:`, error);
    }
  }

  async getStatus(): Promise<CronJobConfig | null> {
    try {
      return await spark.kv.get<CronJobConfig>(this.SCHEDULER_CONFIG_KEY);
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      return null;
    }
  }

  async manualTrigger(): Promise<ImportResult> {
    console.log('Manual release import triggered...');
    
    const sinceDate = new Date();
    sinceDate.setMonth(sinceDate.getMonth() - 3);

    return await this.importService.importNewReleases({
      sinceDate,
      maxReleasesPerArtist: 50
    });
  }
}
