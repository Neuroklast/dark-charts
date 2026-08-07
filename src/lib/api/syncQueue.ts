/**
 * Durable sync queue DAL (Supabase-backed).
 * Decouples enqueue from processing so Vercel cold starts do not drop jobs.
 */

import type { AppSupabaseClient } from '@/types/supabase-client';

export type SyncJobType = 'full' | 'itunes';
export type SyncJobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface SyncJob {
  id: string;
  artistId: string | null;
  artistName: string | null;
  jobType: SyncJobType;
  status: SyncJobStatus;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  lockedUntil: string | null;
  cancelRequestedAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: string;
}

export const MAX_ATTEMPTS = 3;
export const LOCK_DURATION_MS = 10 * 60 * 1000;
export const RATE_LIMIT_JOB_COOLDOWN_MS = 15 * 60 * 1000;

type SyncQueueRow = {
  id: string;
  artistId: string | null;
  jobType: string;
  status: string;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  lockedUntil: string | null;
  cancelRequestedAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: string;
};

function rowToJob(row: SyncQueueRow, artistName: string | null = null): SyncJob {
  return {
    id: row.id,
    artistId: row.artistId ?? null,
    artistName,
    jobType: (row.jobType as SyncJobType) ?? 'full',
    status: row.status as SyncJobStatus,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt ?? null,
    finishedAt: row.finishedAt ?? null,
    lockedUntil: row.lockedUntil ?? null,
    cancelRequestedAt: row.cancelRequestedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
    errorMessage: row.errorMessage ?? null,
    attemptCount: row.attemptCount ?? 0,
    createdAt: row.createdAt,
  };
}

export async function recoverStuckSyncJobs(db: AppSupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const staleStartedBefore = new Date(Date.now() - LOCK_DURATION_MS).toISOString();

  const { data, error } = await db
    .from('sync_queue')
    .update({
      status: 'pending',
      lockedUntil: null,
      startedAt: null,
    })
    .eq('status', 'running')
    .or(
      `lockedUntil.lt.${now},and(lockedUntil.is.null,startedAt.lt.${staleStartedBefore})`
    )
    .select('id');

  if (error) throw new Error(`Failed to recover stuck sync jobs: ${error.message}`);
  return data?.length ?? 0;
}

export async function enqueueArtistSyncJobs(
  db: AppSupabaseClient,
  artistIds: string[],
  jobType: SyncJobType = 'full'
): Promise<number> {
  if (artistIds.length === 0) return 0;

  const { data: existing, error: existingError } = await db
    .from('sync_queue')
    .select('artistId')
    .in('artistId', artistIds)
    .in('status', ['pending', 'running'])
    .in('jobType', [jobType, 'full']);

  if (existingError) {
    throw new Error(`Failed to check existing sync jobs: ${existingError.message}`);
  }

  const alreadyQueued = new Set(
    (existing ?? []).map((r) => r.artistId).filter((id): id is string => Boolean(id))
  );
  const toEnqueue = artistIds.filter((id) => !alreadyQueued.has(id));
  if (toEnqueue.length === 0) return 0;

  const jobs = toEnqueue.map((artistId) => ({
    artistId,
    jobType,
    status: 'pending' as const,
    scheduledAt: new Date().toISOString(),
  }));

  const { error } = await db.from('sync_queue').insert(jobs);
  if (error) throw new Error(`Failed to enqueue sync jobs: ${error.message}`);
  return toEnqueue.length;
}

export async function enqueueAllVisibleArtists(
  db: AppSupabaseClient,
  jobType: SyncJobType = 'full'
): Promise<{ queued: number; total: number }> {
  const { data: artists, error } = await db
    .from('artists')
    .select('id')
    .eq('isVisible', true);

  if (error) throw new Error(`Failed to load artists for sync queue: ${error.message}`);
  const ids = (artists ?? []).map((a) => a.id);
  const queued = await enqueueArtistSyncJobs(db, ids, jobType);
  return { queued, total: ids.length };
}

export async function claimNextSyncJob(db: AppSupabaseClient): Promise<SyncJob | null> {
  await recoverStuckSyncJobs(db);

  const now = new Date().toISOString();
  const { data: candidates, error } = await db
    .from('sync_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduledAt', now)
    .order('scheduledAt', { ascending: true })
    .limit(5);

  if (error) throw new Error(`Failed to claim sync job: ${error.message}`);
  if (!candidates?.length) return null;

  for (const candidate of candidates as SyncQueueRow[]) {
    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
    const nextAttempt = (candidate.attemptCount ?? 0) + 1;

    const { data: claimed, error: claimError } = await db
      .from('sync_queue')
      .update({
        status: 'running',
        startedAt: now,
        lockedUntil,
        attemptCount: nextAttempt,
        errorMessage: null,
      })
      .eq('id', candidate.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (claimError) {
      throw new Error(`Failed to claim sync job: ${claimError.message}`);
    }
    if (!claimed) continue;

    let artistName: string | null = null;
    if (claimed.artistId) {
      const { data: artist } = await db
        .from('artists')
        .select('name')
        .eq('id', claimed.artistId)
        .maybeSingle();
      artistName = artist?.name ?? null;
    }

    return rowToJob(claimed as SyncQueueRow, artistName);
  }

  return null;
}

export async function isSyncJobCancelRequested(
  db: AppSupabaseClient,
  jobId: string
): Promise<boolean> {
  const { data, error } = await db
    .from('sync_queue')
    .select('cancelRequestedAt')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw new Error(`Failed to check cancel request: ${error.message}`);
  return Boolean(data?.cancelRequestedAt);
}

export async function markSyncJobCancelled(
  db: AppSupabaseClient,
  jobId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db
    .from('sync_queue')
    .update({
      status: 'cancelled',
      cancelledAt: now,
      finishedAt: now,
      lockedUntil: null,
      errorMessage: 'Cancelled by admin',
    })
    .eq('id', jobId);

  if (error) throw new Error(`Failed to mark job cancelled: ${error.message}`);
}

export async function markSyncJobDone(db: AppSupabaseClient, jobId: string): Promise<void> {
  if (await isSyncJobCancelRequested(db, jobId)) {
    await markSyncJobCancelled(db, jobId);
    return;
  }

  const { error } = await db
    .from('sync_queue')
    .update({
      status: 'done',
      finishedAt: new Date().toISOString(),
      lockedUntil: null,
    })
    .eq('id', jobId);

  if (error) throw new Error(`Failed to mark job done: ${error.message}`);
}

export async function markSyncJobFailed(
  db: AppSupabaseClient,
  jobId: string,
  errorMessage: string,
  currentAttemptCount: number,
  options?: { rateLimited?: boolean }
): Promise<void> {
  if (await isSyncJobCancelRequested(db, jobId)) {
    await markSyncJobCancelled(db, jobId);
    return;
  }

  const rateLimited = options?.rateLimited ?? false;
  const willRetry = rateLimited || currentAttemptCount < MAX_ATTEMPTS;
  const delayMs = rateLimited
    ? RATE_LIMIT_JOB_COOLDOWN_MS
    : Math.pow(2, currentAttemptCount) * 60 * 1000;
  const scheduledAt = new Date(Date.now() + delayMs).toISOString();

  const { error } = await db
    .from('sync_queue')
    .update({
      status: willRetry ? 'pending' : 'failed',
      finishedAt: willRetry ? null : new Date().toISOString(),
      errorMessage: rateLimited ? 'Rate limited — rescheduled' : errorMessage,
      lockedUntil: null,
      ...(willRetry
        ? {
            scheduledAt,
            startedAt: null,
            ...(rateLimited
              ? { attemptCount: Math.max(0, currentAttemptCount - 1) }
              : {}),
          }
        : {}),
    })
    .eq('id', jobId);

  if (error) throw new Error(`Failed to mark job failed: ${error.message}`);
}

async function countByStatus(
  db: AppSupabaseClient,
  status: SyncJobStatus,
  createdSince?: string
): Promise<number> {
  let query = db
    .from('sync_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);

  if (createdSince) {
    query = query.gte('createdAt', createdSince);
  }

  const { count, error } = await query;
  if (error) throw new Error(`Failed to count sync queue (${status}): ${error.message}`);
  return count ?? 0;
}

export async function getSyncQueueStats(db: AppSupabaseClient): Promise<{
  pending: number;
  running: number;
  done: number;
  failed: number;
}> {
  const createdSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [pending, running, done, failed] = await Promise.all([
    countByStatus(db, 'pending'),
    countByStatus(db, 'running'),
    countByStatus(db, 'done', createdSince),
    countByStatus(db, 'failed', createdSince),
  ]);
  return { pending, running, done, failed };
}
