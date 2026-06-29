import { logger } from "@/lib/logger";
import { Artist, Release, ArtistCacheStatus } from '@/types';
import { spotifyService } from './spotifyService';
import { asyncStorage } from '@/lib/storage/asyncStorage';
import { SupabaseArtistRepository } from '@/backend/repositories/supabase/SupabaseArtistRepository';
import { SupabaseReleaseRepository } from '@/backend/repositories/supabase/SupabaseReleaseRepository';

const SYNC_INTERVAL = 7 * 24 * 60 * 60 * 1000;

const artistRepository = new SupabaseArtistRepository();
const releaseRepository = new SupabaseReleaseRepository();

const toFrontendArtist = (artist: any): Artist => ({
  id: artist.id,
  name: artist.name,
  spotifyId: artist.spotifyId ?? undefined,
  genres: artist.genres ?? [],
  artwork: artist.imageUrl ?? undefined,
  bio: artist.bio ?? undefined,
  createdAt: new Date(artist.createdAt).getTime(),
  updatedAt: new Date(artist.updatedAt).getTime(),
});

const toFrontendRelease = (release: any): Release => ({
  id: release.id,
  artistId: release.artistId,
  artistName: release.artistName ?? '',
  title: release.title,
  releaseDate: new Date(release.releaseDate).toISOString(),
  albumArt: release.artworkUrl ?? release.itunesArtworkUrl ?? undefined,
  spotifyUri: release.spotifyUrl ?? undefined,
  type: release.albumType === 'ep' ? 'ep' : release.albumType === 'single' ? 'single' : 'album',
  createdAt: new Date(release.createdAt).getTime(),
  lastCached: new Date(release.updatedAt).getTime(),
});

const toSpotifyLink = (spotifyIdOrUrl: string): string =>
  spotifyIdOrUrl.startsWith('http')
    ? spotifyIdOrUrl
    : `https://open.spotify.com/artist/${spotifyIdOrUrl}`;

class ArtistManagementService {
  private syncInProgress = new Set<string>();

  async getAllArtists(): Promise<Artist[]> {
    try {
      const artists = await artistRepository.findAll();
      return artists.map(toFrontendArtist).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('Failed to load artists:', error);
      return [];
    }
  }

  async getArtist(artistId: string): Promise<Artist | null> {
    try {
      const artist = await artistRepository.findById(artistId);
      return artist ? toFrontendArtist(artist) : null;
    } catch (error) {
      logger.error('Failed to load artist:', error);
      return null;
    }
  }

  async createArtist(artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Artist> {
    const created = await artistRepository.create({
      name: artistData.name,
      bio: artistData.bio,
      genres: artistData.genres as string[],
      imageUrl: artistData.artwork,
      socialLinks: artistData.spotifyId
        ? { spotify: toSpotifyLink(artistData.spotifyId) }
        : undefined,
    });

    await this.syncArtistReleases(created.id);
    return toFrontendArtist(created);
  }

  async updateArtist(artistId: string, updates: Partial<Omit<Artist, 'id' | 'createdAt'>>): Promise<Artist | null> {
    const updated = await artistRepository.update(artistId, {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
      ...(updates.genres !== undefined ? { genres: updates.genres as string[] } : {}),
      ...(updates.artwork !== undefined ? { imageUrl: updates.artwork } : {}),
      ...(updates.spotifyId !== undefined ? { spotifyId: updates.spotifyId } : {}),
    });

    return updated ? toFrontendArtist(updated) : null;
  }

  async deleteArtist(artistId: string): Promise<void> {
    await artistRepository.delete(artistId);

    const releases = await this.getArtistReleases(artistId);
    for (const release of releases) {
      await releaseRepository.delete(release.id);
    }

    await asyncStorage.delete(`artist-cache-status:${artistId}`);
  }

  async getArtistReleases(artistId: string): Promise<Release[]> {
    try {
      const releases = await releaseRepository.getByArtistId(artistId);
      return releases.map(toFrontendRelease).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    } catch (error) {
      logger.error('Failed to load releases:', error);
      return [];
    }
  }

  async syncArtistReleases(artistId: string): Promise<void> {
    if (this.syncInProgress.has(artistId)) {
      return;
    }

    this.syncInProgress.add(artistId);

    try {
      const artist = await this.getArtist(artistId);
      if (!artist) {
        throw new Error('Artist not found');
      }

      await this.updateCacheStatus(artistId, 'syncing');

      if (artist.spotifyId) {
        await this.syncSpotifyReleases(artistId, artist.spotifyId, artist.name);
      }

      await this.updateCacheStatus(artistId, 'success');
    } catch (error) {
      logger.error(`Failed to sync releases for artist ${artistId}:`, error);
      await this.updateCacheStatus(artistId, 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.syncInProgress.delete(artistId);
    }
  }

  private async syncSpotifyReleases(artistId: string, spotifyId: string, artistName: string): Promise<void> {
    try {
      const isAuthenticated = await spotifyService.isAuthenticated();

      if (!isAuthenticated) {
        logger.warn('Spotify not authenticated, using mock data');
        await this.syncMockReleases(artistId, spotifyId, artistName);
        return;
      }

      const artist = await this.getArtist(artistId);
      if (!artist) {
        throw new Error('Artist not found');
      }

      const releases = await spotifyService.syncArtistReleases(artist);
      logger.info(`Synced ${releases.length} releases for ${artistName}`);
    } catch (error) {
      logger.error('Failed to sync Spotify releases, falling back to mock:', error);
      await this.syncMockReleases(artistId, spotifyId, artistName);
    }
  }

  private async syncMockReleases(artistId: string, spotifyId: string, artistName: string): Promise<void> {
    const now = Date.now();
    const mockReleases = [
      {
        artistId,
        artistName,
        title: 'Latest Album',
        releaseDate: new Date(now - 30 * 24 * 60 * 60 * 1000),
        albumType: 'album' as const,
        totalTracks: 10,
        spotifyId,
        spotifyUrl: `https://open.spotify.com/album/${spotifyId}`,
        artworkUrl: `https://picsum.photos/seed/${spotifyId}-1/600/600`,
        highResArtworkUrl: `https://picsum.photos/seed/${spotifyId}-1/1200/1200`,
        platformLinks: { spotify: `https://open.spotify.com/album/${spotifyId}` },
        genres: [],
      },
      {
        artistId,
        artistName,
        title: 'New Single',
        releaseDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
        albumType: 'single' as const,
        totalTracks: 1,
        spotifyId: `${spotifyId}-single`,
        spotifyUrl: `https://open.spotify.com/track/${spotifyId}`,
        artworkUrl: `https://picsum.photos/seed/${spotifyId}-2/600/600`,
        highResArtworkUrl: `https://picsum.photos/seed/${spotifyId}-2/1200/1200`,
        platformLinks: { spotify: `https://open.spotify.com/track/${spotifyId}` },
        genres: [],
      },
    ];

    for (const release of mockReleases) {
      if (!(await releaseRepository.exists(artistId, release.title, release.releaseDate))) {
        await releaseRepository.create(release);
      }
    }
  }

  private async updateCacheStatus(
    artistId: string,
    status: ArtistCacheStatus['status'],
    errorMessage?: string
  ): Promise<void> {
    const releases = await this.getArtistReleases(artistId);
    const cacheStatus: ArtistCacheStatus = {
      artistId,
      lastSync: Date.now(),
      nextSync: Date.now() + SYNC_INTERVAL,
      releaseCount: releases.length,
      status,
      errorMessage,
    };

    await asyncStorage.set(`artist-cache-status:${artistId}`, cacheStatus);
  }

  async getCacheStatus(artistId: string): Promise<ArtistCacheStatus | null> {
    try {
      return await asyncStorage.get<ArtistCacheStatus>(`artist-cache-status:${artistId}`);
    } catch (error) {
      logger.error('Failed to load cache status:', error);
      return null;
    }
  }

  async getAllCacheStatuses(): Promise<ArtistCacheStatus[]> {
    try {
      const keys = await asyncStorage.keys('artist-cache-status:');
      const statuses: ArtistCacheStatus[] = [];

      for (const key of keys) {
        const status = await asyncStorage.get<ArtistCacheStatus>(key);
        if (status) {
          statuses.push(status);
        }
      }

      return statuses;
    } catch (error) {
      logger.error('Failed to load cache statuses:', error);
      return [];
    }
  }

  async syncAllArtists(): Promise<void> {
    const artists = await this.getAllArtists();

    for (const artist of artists) {
      await this.syncArtistReleases(artist.id);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async getArtistsNeedingSync(): Promise<Artist[]> {
    const artists = await this.getAllArtists();
    const needingSync: Artist[] = [];

    for (const artist of artists) {
      const status = await this.getCacheStatus(artist.id);
      if (!status || Date.now() >= status.nextSync) {
        needingSync.push(artist);
      }
    }

    return needingSync;
  }
}

export const artistManagementService = new ArtistManagementService();
