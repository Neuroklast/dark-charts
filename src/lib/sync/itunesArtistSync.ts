import { ConsolidatedArtist } from '@/lib/artists/consolidatedArtists';
import { lookupItunesArtistAlbums, pickArtworkUrl } from '@/lib/itunesApi';
import { withItunesRetry } from '@/lib/sync/retryPolicy';
import { ItunesSyncedRelease, upsertItunesReleases } from '@/lib/charts/itunesChartStore';
import { Genre } from '@/types';

const ITUNES_THROTTLE_MS = 400;
const MAX_RELEASES_PER_ARTIST = 3;

function deriveReleaseType(trackCount: number): 'single' | 'ep' | 'album' {
  if (trackCount === 1) return 'single';
  if (trackCount <= 6) return 'ep';
  return 'album';
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many');
}

async function throttle(ms = ITUNES_THROTTLE_MS): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export interface ItunesArtistSyncResult {
  artistId: string;
  artistName: string;
  releasesSynced: number;
  errors: string[];
  rateLimited: boolean;
}

export async function syncConsolidatedArtistFromItunes(
  artist: ConsolidatedArtist,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<ItunesArtistSyncResult> {
  const errors: string[] = [];
  let rateLimited = false;

  try {
    await throttle();
    const albums = await withItunesRetry(() =>
      lookupItunesArtistAlbums(artist.name, fetchFn)
    );

    const sorted = [...albums].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    const latest = sorted.slice(0, MAX_RELEASES_PER_ARTIST);
    const releases: ItunesSyncedRelease[] = [];

    for (const album of latest) {
      const artworkUrl = pickArtworkUrl(album);
      const releaseDate = album.releaseDate?.split('T')[0] ?? new Date().toISOString().split('T')[0];
      const genres =
        artist.subgenres.length > 0
          ? artist.subgenres
          : ([album.primaryGenreName].filter(Boolean) as Genre[]);

      releases.push({
        id: `itunes:${album.collectionId}`,
        artistId: artist.id,
        artistName: artist.name,
        title: album.collectionName,
        releaseDate,
        artworkUrl,
        collectionViewUrl: album.collectionViewUrl,
        itunesId: String(album.collectionId),
        genres,
        mainGenre: artist.mainGenre,
        releaseType: deriveReleaseType(album.trackCount ?? 1),
        label: artist.label,
        syncedAt: Date.now(),
      });
    }

    if (releases.length > 0) {
      upsertItunesReleases(releases);
    }

    return {
      artistId: artist.id,
      artistName: artist.name,
      releasesSynced: releases.length,
      errors,
      rateLimited: false,
    };
  } catch (error) {
    rateLimited = isRateLimitError(error);
    errors.push(error instanceof Error ? error.message : String(error));
    return {
      artistId: artist.id,
      artistName: artist.name,
      releasesSynced: 0,
      errors,
      rateLimited,
    };
  }
}