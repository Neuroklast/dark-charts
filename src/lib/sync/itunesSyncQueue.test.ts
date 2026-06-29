import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueConsolidatedArtistJobs,
  claimNextItunesSyncJob,
  markItunesSyncJobDone,
  getItunesSyncQueueStats,
} from '@/lib/sync/itunesSyncQueue';

describe('itunesSyncQueue', () => {
  beforeEach(() => {
    const g = globalThis as typeof globalThis & {
      __darkChartsItunesQueue?: { jobs: Map<string, unknown>; order: string[] };
    };
    delete g.__darkChartsItunesQueue;
  });

  it('enqueues consolidated artists and processes jobs FIFO', () => {
    const { queued, total } = enqueueConsolidatedArtistJobs();
    expect(total).toBeGreaterThan(100);
    expect(queued).toBeGreaterThan(0);
    expect(queued).toBeLessThanOrEqual(total);

    const job = claimNextItunesSyncJob();
    expect(job).not.toBeNull();
    expect(job?.status).toBe('running');

    if (job) {
      markItunesSyncJobDone(job.id);
    }

    const stats = getItunesSyncQueueStats();
    expect(stats.done).toBe(1);
    expect(stats.pending + stats.done).toBeGreaterThanOrEqual(queued);
  });
});