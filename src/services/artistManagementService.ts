import { Artist, Release, ReleaseTrack, ArtistCacheStatus } from '@/types';
import { spotifyService } from './spotifyService';

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const SYNC_INTERVAL = 7 * 24 * 60 * 60 * 1000;

class ArtistManagementService {
  private syncInProgress = new Set<string>();

  async getAllArtists(): Promise<Artist[]> {
    try {
      const keys = await spark.kv.keys();
      const artistKeys = keys.filter(key => key.startsWith('artist:'));
      const artists: Artist[] = [];

      for (const key of artistKeys) {
        const artist = await spark.kv.get<Artist>(key);
        if (artist) {
          artists.push(artist);
        }
      }

      return artists.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to load artists:', error);
      return [];
    }
  }

  async getArtist(artistId: string): Promise<Artist | null> {
    try {
      return await spark.kv.get<Artist>(`artist:${artistId}`);
    } catch (error) {
      console.error('Failed to load artist:', error);
      return null;
    }
  }

  async createArtist(artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Artist> {
    const now = Date.now();
    const artist: Artist = {
      ...artistData,
      id: `artist-${now}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    await spark.kv.set(`artist:${artist.id}`, artist);
    await this.syncArtistReleases(artist.id);
    
    return artist;
  }

  async updateArtist(artistId: string, updates: Partial<Omit<Artist, 'id' | 'createdAt'>>): Promise<Artist | null> {
    const artist = await this.getArtist(artistId);
    if (!artist) return null;

    const updatedArtist: Artist = {
      ...artist,
      ...updates,
      updatedAt: Date.now(),
    };

    await spark.kv.set(`artist:${artistId}`, updatedArtist);
    return updatedArtist;
  }

  async deleteArtist(artistId: string): Promise<void> {
    await spark.kv.delete(`artist:${artistId}`);
    
    const releases = await this.getArtistReleases(artistId);
    for (const release of releases) {
      await spark.kv.delete(`release:${release.id}`);
    }
    
    await spark.kv.delete(`artist-cache-status:${artistId}`);
  }

  async getArtistReleases(artistId: string): Promise<Release[]> {
    try {
      const keys = await spark.kv.keys();
      const releaseKeys = keys.filter(key => key.startsWith('release:'));
      const releases: Release[] = [];

      for (const key of releaseKeys) {
        const release = await spark.kv.get<Release>(key);
        if (release && release.artistId === artistId) {
          releases.push(release);
        }
      }

      return releases.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    } catch (error) {
      console.error('Failed to load releases:', error);
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
      console.error(`Failed to sync releases for artist ${artistId}:`, error);
      await this.updateCacheStatus(artistId, 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.syncInProgress.delete(artistId);
    }
  }

  private async syncSpotifyReleases(artistId: string, spotifyId: string, artistName: string): Promise<void> {
    try {
      const isAuthenticated = await spotifyService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.warn('Spotify not authenticated, using mock data');
        await this.syncMockReleases(artistId, spotifyId, artistName);
        return;
      }

      const artist = await this.getArtist(artistId);
      if (!artist) {
        throw new Error('Artist not found');
      }

      const releases = await spotifyService.syncArtistReleases(artist);
      console.log(`Synced ${releases.length} releases for ${artistName}`);
    } catch (error) {
      console.error('Failed to sync Spotify releases, falling back to mock:', error);
      await this.syncMockReleases(artistId, spotifyId, artistName);
    }
  }

  private async syncMockReleases(artistId: string, spotifyId: string, artistName: string): Promise<void> {
    const mockReleases: Release[] = [
      {
        id: `release-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        artistId,
        artistName,
        title: 'Latest Album',
        releaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'album',
        albumArt: `https://picsum.photos/seed/${spotifyId}-1/600/600`,
        spotifyUri: `spotify:album:${spotifyId}`,
        createdAt: Date.now(),
        lastCached: Date.now(),
      },
      {
        id: `release-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        artistId,
        artistName,
        title: 'New Single',
        releaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'single',
        albumArt: `https://picsum.photos/seed/${spotifyId}-2/600/600`,
        spotifyUri: `spotify:track:${spotifyId}`,
        createdAt: Date.now(),
        lastCached: Date.now(),
      },
    ];

    for (const release of mockReleases) {
      await spark.kv.set(`release:${release.id}`, release);
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

    await spark.kv.set(`artist-cache-status:${artistId}`, cacheStatus);
  }

  async getCacheStatus(artistId: string): Promise<ArtistCacheStatus | null> {
    try {
      return await spark.kv.get<ArtistCacheStatus>(`artist-cache-status:${artistId}`);
    } catch (error) {
      console.error('Failed to load cache status:', error);
      return null;
    }
  }

  async getAllCacheStatuses(): Promise<ArtistCacheStatus[]> {
    try {
      const keys = await spark.kv.keys();
      const statusKeys = keys.filter(key => key.startsWith('artist-cache-status:'));
      const statuses: ArtistCacheStatus[] = [];

      for (const key of statusKeys) {
        const status = await spark.kv.get<ArtistCacheStatus>(key);
        if (status) {
          statuses.push(status);
        }
      }

      return statuses;
    } catch (error) {
      console.error('Failed to load cache statuses:', error);
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
