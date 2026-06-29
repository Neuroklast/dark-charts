import { getConsolidatedArtistById } from '@/lib/artists/consolidatedArtists';
import {
  claimNextItunesSyncJob,
  enqueueConsolidatedArtistJobs,
  markItunesSyncJobDone,
  markItunesSyncJobFailed,
  getItunesSyncQueueStats,
} from '@/lib/sync/itunesSyncQueue';
import { syncConsolidatedArtistFromItunes } from '@/lib/sync/itunesArtistSync';
import { getItunesReleaseCount } from '@/lib/charts/itunesChartStore';
import { logger } from '@/lib/logger';

export const ITUNES_SYNC_TIME_BUDGET_MS = 50_000;
export const ITUNES_BOOTSTRAP_TIME_BUDGET_MS = 8_000;
export const ITUNES_MIN_RELEASES_FOR_CHARTS = 12;

export interface ItunesSyncProcessResult {
  processed: number;
  synced: number;
  failed: number;
  rateLimited: number;
  releasesTotal: number;
  queue: ReturnType<typeof getItunesSyncQueueStats>;
  timedOut: boolean;
}

export async function processItunesSyncQueue(
  options: { timeBudgetMs?: number; maxJobs?: number } = {}
): Promise<ItunesSyncProcessResult> {
  const timeBudgetMs = options.timeBudgetMs ?? ITUNES_SYNC_TIME_BUDGET_MS;
  const maxJobs = options.maxJobs ?? Number.POSITIVE_INFINITY;
  const startedAt = Date.now();

  let processed = 0;
  let synced = 0;
  let failed = 0;
  let rateLimited = 0;
  let timedOut = false;

  while (processed < maxJobs) {
    if (Date.now() - startedAt >= timeBudgetMs) {
      timedOut = true;
      break;
    }

    const job = claimNextItunesSyncJob();
    if (!job) break;

    const artist = getConsolidatedArtistById(job.artistId);
    if (!artist) {
      markItunesSyncJobFailed(job.id, 'Artist not found in consolidated CSV');
      failed++;
      processed++;
      continue;
    }

    const result = await syncConsolidatedArtistFromItunes(artist);

    if (result.rateLimited) {
      markItunesSyncJobFailed(job.id, result.errors.join('; '), { rateLimited: true });
      rateLimited++;
      processed++;
      break;
    }

    if (result.errors.length > 0 && result.releasesSynced === 0) {
      markItunesSyncJobFailed(job.id, result.errors.join('; '));
      failed++;
    } else {
      markItunesSyncJobDone(job.id);
      synced++;
    }

    processed++;
  }

  return {
    processed,
    synced,
    failed,
    rateLimited,
    releasesTotal: getItunesReleaseCount(),
    queue: getItunesSyncQueueStats(),
    timedOut,
  };
}

export async function ensureItunesChartsBootstrapped(
  options: { timeBudgetMs?: number } = {}
): Promise<ItunesSyncProcessResult | null> {
  const releaseCount = getItunesReleaseCount();
  if (releaseCount >= ITUNES_MIN_RELEASES_FOR_CHARTS) {
    return null;
  }

  const enqueue = enqueueConsolidatedArtistJobs();
  logger.info('Bootstrapping iTunes charts from consolidated artists', {
    queued: enqueue.queued,
    totalArtists: enqueue.total,
    currentReleases: releaseCount,
  });

  return processItunesSyncQueue({
    timeBudgetMs: options.timeBudgetMs ?? ITUNES_BOOTSTRAP_TIME_BUDGET_MS,
    maxJobs: 8,
  });
}