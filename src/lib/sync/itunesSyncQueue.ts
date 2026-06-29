import { loadConsolidatedArtists } from '@/lib/artists/consolidatedArtists';

export type ItunesSyncJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface ItunesSyncJob {
  id: string;
  artistId: string;
  artistName: string;
  status: ItunesSyncJobStatus;
  scheduledAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  attemptCount: number;
  errorMessage: string | null;
}

export const ITUNES_SYNC_MAX_ATTEMPTS = 3;
export const ITUNES_SYNC_LOCK_MS = 10 * 60 * 1000;
export const ITUNES_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

interface QueueState {
  jobs: Map<string, ItunesSyncJob>;
  order: string[];
}

type GlobalStore = typeof globalThis & {
  __darkChartsItunesQueue?: QueueState;
};

function getStore(): QueueState {
  const g = globalThis as GlobalStore;
  if (!g.__darkChartsItunesQueue) {
    g.__darkChartsItunesQueue = { jobs: new Map(), order: [] };
  }
  return g.__darkChartsItunesQueue;
}

function recoverStuckJobs(store: QueueState): void {
  const now = Date.now();
  for (const job of store.jobs.values()) {
    if (
      job.status === 'running' &&
      job.startedAt &&
      now - job.startedAt > ITUNES_SYNC_LOCK_MS
    ) {
      job.status = 'pending';
      job.startedAt = null;
    }
  }
}

export function enqueueConsolidatedArtistJobs(): { queued: number; total: number } {
  const store = getStore();
  const artists = loadConsolidatedArtists();
  let queued = 0;

  for (const artist of artists) {
    const existing = store.jobs.get(artist.id);
    if (existing && (existing.status === 'pending' || existing.status === 'running')) {
      continue;
    }

    const job: ItunesSyncJob = {
      id: artist.id,
      artistId: artist.id,
      artistName: artist.name,
      status: 'pending',
      scheduledAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      attemptCount: 0,
      errorMessage: null,
    };

    if (!existing) {
      store.order.push(artist.id);
    }

    store.jobs.set(artist.id, job);
    queued++;
  }

  return { queued, total: artists.length };
}

export function claimNextItunesSyncJob(): ItunesSyncJob | null {
  const store = getStore();
  recoverStuckJobs(store);
  const now = Date.now();

  for (const jobId of store.order) {
    const job = store.jobs.get(jobId);
    if (!job) continue;
    if (job.status !== 'pending') continue;
    if (job.scheduledAt > now) continue;
    if (job.attemptCount >= ITUNES_SYNC_MAX_ATTEMPTS) continue;

    job.status = 'running';
    job.startedAt = now;
    job.attemptCount += 1;
    return { ...job };
  }

  return null;
}

export function markItunesSyncJobDone(jobId: string): void {
  const job = getStore().jobs.get(jobId);
  if (!job) return;
  job.status = 'done';
  job.finishedAt = Date.now();
  job.errorMessage = null;
}

export function markItunesSyncJobFailed(
  jobId: string,
  errorMessage: string,
  options?: { rateLimited?: boolean }
): void {
  const job = getStore().jobs.get(jobId);
  if (!job) return;

  const rateLimited = options?.rateLimited ?? false;
  const willRetry = rateLimited || job.attemptCount < ITUNES_SYNC_MAX_ATTEMPTS;

  if (willRetry) {
    job.status = 'pending';
    job.startedAt = null;
    job.finishedAt = null;
    job.scheduledAt = Date.now() + (rateLimited ? ITUNES_RATE_LIMIT_COOLDOWN_MS : 60_000);
    job.errorMessage = rateLimited ? 'Rate limited — rescheduled' : errorMessage;
    if (rateLimited) {
      job.attemptCount = Math.max(0, job.attemptCount - 1);
    }
    return;
  }

  job.status = 'failed';
  job.finishedAt = Date.now();
  job.errorMessage = errorMessage;
}

export function getItunesSyncQueueStats(): {
  pending: number;
  running: number;
  done: number;
  failed: number;
  total: number;
} {
  const store = getStore();
  const jobs = Array.from(store.jobs.values());
  return {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    done: jobs.filter((j) => j.status === 'done').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    total: jobs.length,
  };
}