/**
 * Idempotent import of a darktunes catalog snapshot into dark-charts Supabase.
 */

import type { AppSupabaseClient } from '@/types/supabase-client';
import { enqueueArtistSyncJobs } from '@/lib/api/syncQueue';

export interface DarktunesArtistImport {
  id?: string;
  name: string;
  spotifyId?: string | null;
  itunesId?: string | null;
  appleMusicUrl?: string | null;
  genres?: string[];
  bio?: string | null;
  imageUrl?: string | null;
  profileLink?: string | null;
  country?: string | null;
  isVisible?: boolean;
}

export interface DarktunesReleaseImport {
  id?: string;
  artistName?: string;
  artistId?: string;
  artistSpotifyId?: string | null;
  title: string;
  releaseDate: string;
  releaseType?: string;
  albumType?: 'album' | 'single' | 'ep' | 'compilation' | null;
  totalTracks?: number | null;
  spotifyId?: string | null;
  itunesId?: string | null;
  appleMusicUrl?: string | null;
  artworkUrl?: string | null;
  itunesArtworkUrl?: string | null;
  highResArtworkUrl?: string | null;
  r2ArtworkUrl?: string | null;
  genres?: string[];
  label?: string | null;
  isVisible?: boolean;
  platformLinks?: Record<string, unknown> | null;
  odesliLinks?: Record<string, unknown> | null;
}

export interface DarktunesCatalogPayload {
  artists?: DarktunesArtistImport[];
  releases?: DarktunesReleaseImport[];
  /** When true, enqueue sync jobs for imported artists */
  enqueueSync?: boolean;
}

export interface ImportCatalogResult {
  artistsCreated: number;
  artistsUpdated: number;
  releasesCreated: number;
  releasesUpdated: number;
  releasesSkipped: number;
  syncJobsQueued: number;
  errors: string[];
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[\(\[][^)\]]*[\)\]]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function upsertArtist(
  db: AppSupabaseClient,
  artist: DarktunesArtistImport,
  result: ImportCatalogResult
): Promise<string | null> {
  try {
    let existingId: string | null = null;

    if (artist.spotifyId) {
      const { data } = await db
        .from('artists')
        .select('id')
        .eq('spotifyId', artist.spotifyId)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (!existingId && artist.itunesId) {
      const { data } = await db
        .from('artists')
        .select('id')
        .eq('itunesId', artist.itunesId)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (!existingId) {
      const { data } = await db
        .from('artists')
        .select('id')
        .ilike('name', artist.name.trim())
        .limit(1)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    const payload = {
      name: artist.name.trim(),
      spotifyId: artist.spotifyId ?? null,
      itunesId: artist.itunesId ?? null,
      appleMusicUrl: artist.appleMusicUrl ?? null,
      genres: artist.genres ?? [],
      bio: artist.bio ?? null,
      imageUrl: artist.imageUrl ?? null,
      profileLink: artist.profileLink ?? artist.appleMusicUrl ?? null,
      country: artist.country ?? null,
      isVisible: artist.isVisible ?? true,
      source: 'darktunes-import',
      updatedAt: new Date().toISOString(),
    };

    if (existingId) {
      const { error } = await db.from('artists').update(payload).eq('id', existingId);
      if (error) {
        result.errors.push(`Artist update "${artist.name}": ${error.message}`);
        return null;
      }
      result.artistsUpdated++;
      return existingId;
    }

    const { data: created, error } = await db
      .from('artists')
      .insert(payload)
      .select('id')
      .single();

    if (error || !created) {
      result.errors.push(`Artist create "${artist.name}": ${error?.message ?? 'unknown'}`);
      return null;
    }
    result.artistsCreated++;
    return created.id;
  } catch (err) {
    result.errors.push(
      `Artist "${artist.name}": ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

async function upsertRelease(
  db: AppSupabaseClient,
  release: DarktunesReleaseImport,
  artistIdByName: Map<string, string>,
  artistIdBySpotify: Map<string, string>,
  result: ImportCatalogResult
): Promise<void> {
  try {
    let artistId = release.artistId ?? null;
    if (!artistId && release.artistSpotifyId) {
      artistId = artistIdBySpotify.get(release.artistSpotifyId) ?? null;
    }
    if (!artistId && release.artistName) {
      artistId = artistIdByName.get(release.artistName.trim().toLowerCase()) ?? null;
    }
    if (!artistId) {
      result.errors.push(`Release "${release.title}": artist not resolved`);
      result.releasesSkipped++;
      return;
    }

    const releaseDate = release.releaseDate.split('T')[0];
    let existingId: string | null = null;

    if (release.spotifyId) {
      const { data } = await db
        .from('releases')
        .select('id')
        .eq('spotifyId', release.spotifyId)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (!existingId && release.itunesId) {
      const { data } = await db
        .from('releases')
        .select('id')
        .eq('itunesId', release.itunesId)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (!existingId) {
      const { data: candidates } = await db
        .from('releases')
        .select('id, title, releaseDate')
        .eq('artistId', artistId);
      const normalized = normalizeTitle(release.title);
      const match = (candidates ?? []).find(
        (row) =>
          normalizeTitle(row.title) === normalized &&
          String(row.releaseDate).slice(0, 10) === releaseDate
      );
      existingId = match?.id ?? null;
    }

    const albumType =
      release.albumType ??
      (release.releaseType as 'album' | 'single' | 'ep' | 'compilation' | undefined) ??
      'single';

    const payload = {
      title: release.title.trim(),
      releaseDate,
      releaseType: release.releaseType ?? albumType ?? 'single',
      albumType: albumType as 'album' | 'single' | 'ep' | 'compilation',
      artistId,
      totalTracks: release.totalTracks ?? null,
      spotifyId: release.spotifyId ?? null,
      itunesId: release.itunesId ?? null,
      appleMusicUrl: release.appleMusicUrl ?? null,
      artworkUrl: release.artworkUrl ?? release.itunesArtworkUrl ?? null,
      itunesArtworkUrl: release.itunesArtworkUrl ?? release.artworkUrl ?? null,
      highResArtworkUrl:
        release.highResArtworkUrl ?? release.artworkUrl ?? release.itunesArtworkUrl ?? null,
      r2ArtworkUrl: release.r2ArtworkUrl ?? null,
      genres: release.genres ?? [],
      label: release.label ?? null,
      platformLinks: release.platformLinks ?? null,
      odesliLinks: release.odesliLinks ?? null,
      isVisible: release.isVisible ?? true,
      source: 'darktunes-import',
      syncPolicy: 'auto',
      updatedAt: new Date().toISOString(),
    };

    if (existingId) {
      const { error } = await db.from('releases').update(payload).eq('id', existingId);
      if (error) {
        result.errors.push(`Release update "${release.title}": ${error.message}`);
        return;
      }
      result.releasesUpdated++;
      return;
    }

    const { error } = await db.from('releases').insert(payload);
    if (error) {
      if (error.code === '23505') {
        result.releasesSkipped++;
        return;
      }
      result.errors.push(`Release create "${release.title}": ${error.message}`);
      return;
    }
    result.releasesCreated++;
  } catch (err) {
    result.errors.push(
      `Release "${release.title}": ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function importDarktunesCatalog(
  db: AppSupabaseClient,
  payload: DarktunesCatalogPayload
): Promise<ImportCatalogResult> {
  const result: ImportCatalogResult = {
    artistsCreated: 0,
    artistsUpdated: 0,
    releasesCreated: 0,
    releasesUpdated: 0,
    releasesSkipped: 0,
    syncJobsQueued: 0,
    errors: [],
  };

  const artistIdByName = new Map<string, string>();
  const artistIdBySpotify = new Map<string, string>();
  const importedArtistIds: string[] = [];

  for (const artist of payload.artists ?? []) {
    const id = await upsertArtist(db, artist, result);
    if (!id) continue;
    importedArtistIds.push(id);
    artistIdByName.set(artist.name.trim().toLowerCase(), id);
    if (artist.spotifyId) artistIdBySpotify.set(artist.spotifyId, id);
  }

  // Refresh name map from DB for releases that only reference artists already present
  if ((payload.releases ?? []).length > 0) {
    const { data: allArtists } = await db.from('artists').select('id, name, spotifyId');
    for (const a of allArtists ?? []) {
      artistIdByName.set(a.name.trim().toLowerCase(), a.id);
      if (a.spotifyId) artistIdBySpotify.set(a.spotifyId, a.id);
    }
  }

  for (const release of payload.releases ?? []) {
    await upsertRelease(db, release, artistIdByName, artistIdBySpotify, result);
  }

  if (payload.enqueueSync !== false && importedArtistIds.length > 0) {
    result.syncJobsQueued = await enqueueArtistSyncJobs(db, importedArtistIds, 'full');
  }

  return result;
}
