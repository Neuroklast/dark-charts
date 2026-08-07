/**
 * Drain durable sync_queue within a time budget (Vercel maxDuration-safe).
 */

import type { AppSupabaseClient } from '@/types/supabase-client';
import {
  claimNextSyncJob,
  getSyncQueueStats,
  isSyncJobCancelRequested,
  markSyncJobCancelled,
  markSyncJobDone,
  markSyncJobFailed,
} from '@/lib/api/syncQueue';
import { syncArtist } from '@/lib/sync/syncArtist';
import { logger } from '@/lib/logger';

export const SYNC_TIME_BUDGET_MS = 50_000;

export interface ProcessSyncQueueResult {
  processed: number;
  synced: number;
  failed: number;
  rateLimited: number;
  cancelled: number;
  releasesUpserted: number;
  timedOut: boolean;
  queue: Awaited<ReturnType<typeof getSyncQueueStats>>;
}

export async function processSyncQueue(
  db: AppSupabaseClient,
  options: { timeBudgetMs?: number; maxJobs?: number } = {}
): Promise<ProcessSyncQueueResult> {
  const timeBudgetMs = options.timeBudgetMs ?? SYNC_TIME_BUDGET_MS;
  const maxJobs = options.maxJobs ?? Number.POSITIVE_INFINITY;
  const startedAt = Date.now();

  let processed = 0;
  let synced = 0;
  let failed = 0;
  let rateLimited = 0;
  let cancelled = 0;
  let releasesUpserted = 0;
  let timedOut = false;

  while (processed < maxJobs) {
    if (Date.now() - startedAt >= timeBudgetMs) {
      timedOut = true;
      break;
    }

    const job = await claimNextSyncJob(db);
    if (!job) break;

    if (await isSyncJobCancelRequested(db, job.id)) {
      await markSyncJobCancelled(db, job.id);
      cancelled++;
      processed++;
      continue;
    }

    if (!job.artistId) {
      await markSyncJobFailed(db, job.id, 'Job has no artistId', job.attemptCount);
      failed++;
      processed++;
      continue;
    }

    try {
      const result = await syncArtist(job.artistId, { db });
      releasesUpserted += result.releasesUpserted;

      if (result.rateLimited) {
        await markSyncJobFailed(
          db,
          job.id,
          result.errors.join('; ') || 'Rate limited',
          job.attemptCount,
          { rateLimited: true }
        );
        rateLimited++;
        processed++;
        break;
      }

      if (result.errors.length > 0 && result.releasesUpserted === 0) {
        await markSyncJobFailed(db, job.id, result.errors.join('; '), job.attemptCount);
        failed++;
      } else {
        await markSyncJobDone(db, job.id);
        synced++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Sync job failed', { jobId: job.id, artistId: job.artistId, message });
      await markSyncJobFailed(db, job.id, message, job.attemptCount);
      failed++;
    }

    processed++;
  }

  const queue = await getSyncQueueStats(db);

  return {
    processed,
    synced,
    failed,
    rateLimited,
    cancelled,
    releasesUpserted,
    timedOut,
    queue,
  };
}
