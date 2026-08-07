/**
 * Durable artist sync: iTunes → Supabase releases + optional R2 cover cache.
 * IoC deps make this testable without real HTTP/R2.
 */

import type { AppSupabaseClient } from '@/types/supabase-client';
import {
  extractItunesArtistId,
  lookupItunesArtistAlbums,
  pickArtworkUrl,
  type iTunesCollection,
} from '@/lib/itunesApi';
import { mapWithConcurrency } from '@/lib/mapWithConcurrency';
import { withItunesRetry } from '@/lib/sync/retryPolicy';
import { isR2Configured } from '@/lib/env.server';
import { createSyncUploadFn } from '@/lib/r2Utils';

const RELEASE_SYNC_CONCURRENCY = 2;
const MAX_RELEASES_PER_ARTIST = 25;

export interface SyncDeps {
  db: AppSupabaseClient;
  fetch?: typeof fetch;
  uploadToR2?: (imageUrl: string, filename: string) => Promise<string | null>;
  skipSyncLog?: boolean;
}

export interface SyncResult {
  artistId: string;
  releasesUpserted: number;
  errors: string[];
  rateLimited: boolean;
}

function deriveReleaseType(trackCount: number): 'single' | 'ep' | 'album' {
  if (trackCount === 1) return 'single';
  if (trackCount <= 6) return 'ep';
  return 'album';
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[\(\[][^)\]]*[\)\]]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many');
}

function defaultUploadFn(): SyncDeps['uploadToR2'] {
  if (!isR2Configured()) return undefined;
  const upload = createSyncUploadFn('cover-art');
  return async (imageUrl: string, filename: string) => upload(imageUrl, filename);
}

async function findExistingRelease(
  db: AppSupabaseClient,
  artistId: string,
  itunesId: string,
  title: string,
  releaseDate: string
): Promise<{ id: string } | null> {
  const { data: byItunes } = await db
    .from('releases')
    .select('id')
    .eq('itunesId', itunesId)
    .maybeSingle();
  if (byItunes) return byItunes;

  const { data: byArtist } = await db
    .from('releases')
    .select('id, title, releaseDate')
    .eq('artistId', artistId);

  const normalized = normalizeTitle(title);
  const match = (byArtist ?? []).find((row) => {
    const sameTitle = normalizeTitle(row.title) === normalized;
    const sameDate =
      String(row.releaseDate).slice(0, 10) === releaseDate.slice(0, 10);
    return sameTitle && sameDate;
  });

  return match ? { id: match.id } : null;
}

async function upsertItunesRelease(
  deps: SyncDeps,
  artistId: string,
  album: iTunesCollection,
  artistGenres: string[],
  artistLabel: string | null
): Promise<{ upserted: boolean; errors: string[] }> {
  const { db } = deps;
  const errors: string[] = [];
  const itunesId = String(album.collectionId);
  const releaseDate = album.releaseDate?.split('T')[0] ?? new Date().toISOString().split('T')[0];
  const title = album.collectionName;
  const artworkUrl = pickArtworkUrl(album);
  const releaseType = deriveReleaseType(album.trackCount ?? 1);
  const appleMusicUrl = album.collectionViewUrl ?? null;

  try {
    const existing = await findExistingRelease(db, artistId, itunesId, title, releaseDate);

    let r2ArtworkUrl: string | null = null;
    if (artworkUrl && deps.uploadToR2) {
      try {
        r2ArtworkUrl = await deps.uploadToR2(artworkUrl, `itunes-${itunesId}.jpg`);
      } catch (err) {
        errors.push(
          `Cover art upload failed for "${title}": ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    const payload = {
      title,
      releaseType,
      releaseDate,
      artistId,
      albumType: releaseType as 'album' | 'single' | 'ep',
      totalTracks: album.trackCount ?? null,
      itunesId,
      appleMusicUrl,
      itunesArtworkUrl: artworkUrl,
      artworkUrl: artworkUrl,
      highResArtworkUrl: artworkUrl,
      ...(r2ArtworkUrl ? { r2ArtworkUrl } : {}),
      genres: artistGenres,
      label: artistLabel,
      isVisible: true,
      source: 'itunes',
      syncPolicy: 'auto',
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await db.from('releases').update(payload).eq('id', existing.id);
      if (error) {
        errors.push(`Failed to update "${title}": ${error.message}`);
        return { upserted: false, errors };
      }
      return { upserted: true, errors };
    }

    const { error } = await db.from('releases').insert(payload);
    if (error) {
      // Unique race on itunesId
      if (error.code === '23505') {
        return { upserted: true, errors };
      }
      errors.push(`Failed to insert "${title}": ${error.message}`);
      return { upserted: false, errors };
    }
    return { upserted: true, errors };
  } catch (err) {
    return {
      upserted: false,
      errors: [
        `Failed to upsert "${title}": ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}

/**
 * Sync one artist from iTunes into Supabase. Never throws; errors are collected.
 */
export async function syncArtist(artistId: string, deps: SyncDeps): Promise<SyncResult> {
  const startedAt = Date.now();
  const db = deps.db;
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const uploadToR2 = deps.uploadToR2 ?? defaultUploadFn();
  const resolvedDeps: SyncDeps = { ...deps, fetch: fetchFn, uploadToR2 };

  const errors: string[] = [];
  let releasesUpserted = 0;
  let rateLimited = false;

  const { data: artist, error: artistError } = await db
    .from('artists')
    .select('id, name, genres, socialLinks, itunesId, appleMusicUrl, profileLink')
    .eq('id', artistId)
    .maybeSingle();

  if (artistError || !artist) {
    return {
      artistId,
      releasesUpserted: 0,
      errors: [artistError?.message ?? 'Artist not found'],
      rateLimited: false,
    };
  }

  const itunesArtistId =
    artist.itunesId ??
    extractItunesArtistId(artist.appleMusicUrl) ??
    extractItunesArtistId(artist.profileLink);

  let albums: iTunesCollection[] = [];
  try {
    albums = await withItunesRetry(() =>
      lookupItunesArtistAlbums(artist.name, fetchFn, itunesArtistId)
    );
  } catch (err) {
    rateLimited = isRateLimitError(err);
    errors.push(
      `iTunes fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Prefer newest releases for chart eligibility
  const sorted = [...albums].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
  const limited = sorted.slice(0, MAX_RELEASES_PER_ARTIST);

  const artistGenres = Array.isArray(artist.genres) ? artist.genres : [];
  const labelFromSocial =
    typeof artist.socialLinks === 'object' &&
    artist.socialLinks &&
    'label' in artist.socialLinks
      ? String((artist.socialLinks as { label?: string }).label ?? '')
      : null;
  const artistLabel = labelFromSocial || null;

  if (limited.length > 0) {
    const outcomes = await mapWithConcurrency(
      limited,
      RELEASE_SYNC_CONCURRENCY,
      (album) =>
        upsertItunesRelease(resolvedDeps, artistId, album, artistGenres, artistLabel)
    );

    for (const outcome of outcomes) {
      errors.push(...outcome.errors);
      if (outcome.upserted) releasesUpserted++;
    }
  }

  // Persist discovered iTunes artist id when missing
  const updates: Record<string, unknown> = {
    lastSyncedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!artist.itunesId && itunesArtistId) {
    updates.itunesId = itunesArtistId;
  }

  await db.from('artists').update(updates).eq('id', artistId);

  if (!deps.skipSyncLog) {
    const status =
      errors.length === 0 ? 'success' : releasesUpserted > 0 ? 'partial' : 'error';
    await db.from('sync_logs').insert({
      artistId,
      status,
      message: errors[0] ?? null,
      releasesSynced: releasesUpserted,
      errors,
      apiSource: 'itunes',
      durationMs: Date.now() - startedAt,
      metadata: {
        releasesFound: albums.length,
        releasesProcessed: limited.length,
        rateLimited,
      },
    });
  }

  return { artistId, releasesUpserted, errors, rateLimited };
}
