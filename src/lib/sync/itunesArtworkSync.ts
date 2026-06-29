import type { AppSupabaseClient } from '@/types/supabase-client';
import { logger } from '@/lib/logger';
import { isR2Configured } from '@/lib/env.server';
import { createHashUploadFn } from '@/lib/r2Utils';
import { mapWithConcurrency } from '@/lib/mapWithConcurrency';
import {
  extractItunesArtistId,
  lookupItunesArtistAlbums,
  pickArtworkUrl,
  searchItunesSongArtwork,
} from '@/lib/itunesApi';
import { withItunesRetry } from '@/lib/sync/retryPolicy';

const SYNC_CONCURRENCY = 5;
const ITUNES_THROTTLE_MS = 300;

export interface ArtworkSyncDeps {
  db: AppSupabaseClient;
  fetch: typeof fetch;
  uploadToR2: (imageUrl: string) => Promise<string>;
}

export interface ReleaseRow {
  id: string;
  title: string;
  r2ArtworkUrl: string | null;
  itunesArtworkUrl: string | null;
  artist: { id: string; name: string; profileLink: string | null } | null;
}

export interface ArtworkSyncItemResult {
  releaseId: string;
  title: string;
  status: 'synced' | 'skipped' | 'not_found' | 'error';
  itunesArtworkUrl?: string | null;
  r2ArtworkUrl?: string | null;
  error?: string;
}

export interface ArtworkSyncResult {
  processed: number;
  synced: number;
  skipped: number;
  notFound: number;
  errors: number;
  results: ArtworkSyncItemResult[];
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function createDefaultDeps(db: AppSupabaseClient): ArtworkSyncDeps {
  const uploadToR2 = isR2Configured()
    ? createHashUploadFn('cover-art')
    : async (url: string) => url;

  return { db, fetch: globalThis.fetch, uploadToR2 };
}

async function throttle(ms = ITUNES_THROTTLE_MS): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function resolveItunesArtwork(
  release: ReleaseRow,
  albumArtworkByTitle: Map<string, string>,
  deps: ArtworkSyncDeps
): Promise<string | null> {
  const normalized = normalizeTitle(release.title);
  const fromAlbum = albumArtworkByTitle.get(normalized);
  if (fromAlbum) return fromAlbum;

  const artistName = release.artist?.name;
  if (!artistName) return null;

  await throttle();
  const match = await withItunesRetry(() =>
    searchItunesSongArtwork(artistName, release.title, deps.fetch)
  );
  return match?.artworkUrl ?? null;
}

async function cacheArtworkForRelease(
  release: ReleaseRow,
  artworkUrl: string,
  deps: ArtworkSyncDeps
): Promise<{ itunesArtworkUrl: string; r2ArtworkUrl: string | null }> {
  let r2ArtworkUrl: string | null = null;

  try {
    r2ArtworkUrl = await deps.uploadToR2(artworkUrl);
  } catch (err) {
    logger.warn('R2 artwork cache failed, keeping iTunes URL', {
      releaseId: release.id,
      error: err instanceof Error ? err.message : err,
    });
  }

  const now = new Date().toISOString();
  const { error } = await deps.db
    .from('releases')
    .update({
      itunesArtworkUrl: artworkUrl,
      r2ArtworkUrl,
      artworkUrl: r2ArtworkUrl ?? artworkUrl,
      highResArtworkUrl: artworkUrl,
      updatedAt: now,
    })
    .eq('id', release.id);

  if (error) {
    throw new Error(error.message);
  }

  return { itunesArtworkUrl: artworkUrl, r2ArtworkUrl };
}

export async function syncReleaseArtwork(
  release: ReleaseRow,
  deps: ArtworkSyncDeps,
  options: { force?: boolean; albumArtworkByTitle?: Map<string, string> } = {}
): Promise<ArtworkSyncItemResult> {
  const base = {
    releaseId: release.id,
    title: release.title,
  };

  if (!options.force && release.r2ArtworkUrl && release.itunesArtworkUrl) {
    return { ...base, status: 'skipped', r2ArtworkUrl: release.r2ArtworkUrl };
  }

  try {
    const artworkUrl = await resolveItunesArtwork(
      release,
      options.albumArtworkByTitle ?? new Map(),
      deps
    );

    if (!artworkUrl) {
      return { ...base, status: 'not_found' };
    }

    const cached = await cacheArtworkForRelease(release, artworkUrl, deps);
    return {
      ...base,
      status: 'synced',
      itunesArtworkUrl: cached.itunesArtworkUrl,
      r2ArtworkUrl: cached.r2ArtworkUrl,
    };
  } catch (err) {
    return {
      ...base,
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function buildAlbumArtworkMap(
  artistName: string,
  profileLink: string | null | undefined,
  deps: ArtworkSyncDeps
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const itunesArtistId = extractItunesArtistId(profileLink);

  await throttle();
  const albums = await withItunesRetry(() =>
    lookupItunesArtistAlbums(artistName, deps.fetch, itunesArtistId)
  );

  for (const album of albums) {
    const url = pickArtworkUrl(album);
    if (url) {
      map.set(normalizeTitle(album.collectionName), url);
    }
  }

  return map;
}

export async function syncArtistArtwork(
  db: AppSupabaseClient,
  artistId: string,
  options: { force?: boolean } = {}
): Promise<ArtworkSyncResult> {
  const deps = createDefaultDeps(db);

  const { data: artist, error: artistError } = await deps.db
    .from('artists')
    .select('id, name, profileLink')
    .eq('id', artistId)
    .maybeSingle();

  if (artistError) throw new Error(artistError.message);
  if (!artist) throw new Error('Artist not found');

  const { data: releases, error: releasesError } = await deps.db
    .from('releases')
    .select('id, title, r2ArtworkUrl, itunesArtworkUrl, artist:artists(id, name, profileLink)')
    .eq('artistId', artistId)
    .eq('isVisible', true);

  if (releasesError) throw new Error(releasesError.message);

  const rows = (releases ?? []) as unknown as ReleaseRow[];
  const albumMap = await buildAlbumArtworkMap(artist.name, artist.profileLink, deps);

  const results = await mapWithConcurrency(rows, SYNC_CONCURRENCY, (release) =>
    syncReleaseArtwork(release, deps, { force: options.force, albumArtworkByTitle: albumMap })
  );

  return summarize(results);
}

export async function syncArtworkBatch(
  db: AppSupabaseClient,
  options: {
    releaseId?: string;
    artistId?: string;
    force?: boolean;
    limit?: number;
    offset?: number;
    onlyMissing?: boolean;
  } = {}
): Promise<ArtworkSyncResult> {
  const deps = createDefaultDeps(db);
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  if (options.artistId) {
    return syncArtistArtwork(db, options.artistId, { force: options.force });
  }

  let query = deps.db
    .from('releases')
    .select('id, title, r2ArtworkUrl, itunesArtworkUrl, artist:artists(id, name, profileLink)')
    .eq('isVisible', true)
    .order('updatedAt', { ascending: true });

  if (options.releaseId) {
    query = query.eq('id', options.releaseId);
  } else if (options.onlyMissing !== false) {
    query = query.or('r2ArtworkUrl.is.null,itunesArtworkUrl.is.null');
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ReleaseRow[];
  const albumMaps = new Map<string, Map<string, string>>();

  const results = await mapWithConcurrency(rows, SYNC_CONCURRENCY, async (release) => {
    const artistId = release.artist?.id;
    let albumMap = new Map<string, string>();

    if (artistId && release.artist?.name) {
      if (!albumMaps.has(artistId)) {
        albumMaps.set(
          artistId,
          await buildAlbumArtworkMap(
            release.artist.name,
            release.artist.profileLink,
            deps
          )
        );
      }
      albumMap = albumMaps.get(artistId)!;
    }

    return syncReleaseArtwork(release, deps, {
      force: options.force,
      albumArtworkByTitle: albumMap,
    });
  });

  return summarize(results);
}

function summarize(results: ArtworkSyncItemResult[]): ArtworkSyncResult {
  return {
    processed: results.length,
    synced: results.filter((r) => r.status === 'synced').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    notFound: results.filter((r) => r.status === 'not_found').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
}