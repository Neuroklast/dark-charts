import { IReleaseRepository } from './IReleaseRepository';
import { Release, CreateReleaseDTO } from '../models/Release';

export class SparkKVReleaseRepository implements IReleaseRepository {
  private readonly RELEASES_KEY = 'backend:releases:all';
  private readonly RELEASE_BY_ID_PREFIX = 'backend:release:id:';
  private readonly RELEASE_BY_ARTIST_PREFIX = 'backend:release:artist:';
  private readonly RELEASE_BY_SPOTIFY_PREFIX = 'backend:release:spotify:';

  async getAll(): Promise<Release[]> {
    try {
      const releases = await spark.kv.get<Release[]>(this.RELEASES_KEY);
      return releases || [];
    } catch (error) {
      console.error('Error fetching all releases:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Release | null> {
    try {
      const release = await spark.kv.get<Release>(`${this.RELEASE_BY_ID_PREFIX}${id}`);
      return release || null;
    } catch (error) {
      console.error(`Error fetching release ${id}:`, error);
      return null;
    }
  }

  async getByArtistId(artistId: string): Promise<Release[]> {
    try {
      const releaseIds = await spark.kv.get<string[]>(`${this.RELEASE_BY_ARTIST_PREFIX}${artistId}`);
      if (!releaseIds || releaseIds.length === 0) {
        return [];
      }

      const releases: Release[] = [];
      for (const id of releaseIds) {
        const release = await this.getById(id);
        if (release) {
          releases.push(release);
        }
      }
      return releases;
    } catch (error) {
      console.error(`Error fetching releases for artist ${artistId}:`, error);
      return [];
    }
  }

  async getBySpotifyId(spotifyId: string): Promise<Release | null> {
    try {
      const releaseId = await spark.kv.get<string>(`${this.RELEASE_BY_SPOTIFY_PREFIX}${spotifyId}`);
      if (!releaseId) {
        return null;
      }
      return await this.getById(releaseId);
    } catch (error) {
      console.error(`Error fetching release by Spotify ID ${spotifyId}:`, error);
      return null;
    }
  }

  async exists(artistId: string, title: string, releaseDate: Date): Promise<boolean> {
    try {
      const artistReleases = await this.getByArtistId(artistId);
      const releaseDateStr = releaseDate.toISOString().split('T')[0];
      
      return artistReleases.some(release => {
        const existingDateStr = new Date(release.releaseDate).toISOString().split('T')[0];
        return release.title.toLowerCase() === title.toLowerCase() &&
               existingDateStr === releaseDateStr;
      });
    } catch (error) {
      console.error('Error checking release existence:', error);
      return false;
    }
  }

  async create(dto: CreateReleaseDTO): Promise<Release> {
    try {
      const now = new Date();
      const id = `release-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const release: Release = {
        id,
        ...dto,
        createdAt: now,
        updatedAt: now
      };

      await spark.kv.set(`${this.RELEASE_BY_ID_PREFIX}${id}`, release);

      const allReleases = await this.getAll();
      allReleases.push(release);
      await spark.kv.set(this.RELEASES_KEY, allReleases);

      const artistReleases = await spark.kv.get<string[]>(`${this.RELEASE_BY_ARTIST_PREFIX}${dto.artistId}`) || [];
      artistReleases.push(id);
      await spark.kv.set(`${this.RELEASE_BY_ARTIST_PREFIX}${dto.artistId}`, artistReleases);

      if (dto.spotifyId) {
        await spark.kv.set(`${this.RELEASE_BY_SPOTIFY_PREFIX}${dto.spotifyId}`, id);
      }

      return release;
    } catch (error) {
      console.error('Error creating release:', error);
      throw new Error('Failed to create release');
    }
  }

  async update(id: string, data: Partial<Release>): Promise<Release | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        return null;
      }

      const updated: Release = {
        ...existing,
        ...data,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date()
      };

      await spark.kv.set(`${this.RELEASE_BY_ID_PREFIX}${id}`, updated);

      const allReleases = await this.getAll();
      const index = allReleases.findIndex(r => r.id === id);
      if (index !== -1) {
        allReleases[index] = updated;
        await spark.kv.set(this.RELEASES_KEY, allReleases);
      }

      return updated;
    } catch (error) {
      console.error(`Error updating release ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const release = await this.getById(id);
      if (!release) {
        return false;
      }

      await spark.kv.delete(`${this.RELEASE_BY_ID_PREFIX}${id}`);

      const allReleases = await this.getAll();
      const filtered = allReleases.filter(r => r.id !== id);
      await spark.kv.set(this.RELEASES_KEY, filtered);

      const artistReleases = await spark.kv.get<string[]>(`${this.RELEASE_BY_ARTIST_PREFIX}${release.artistId}`) || [];
      const filteredArtistReleases = artistReleases.filter(rid => rid !== id);
      await spark.kv.set(`${this.RELEASE_BY_ARTIST_PREFIX}${release.artistId}`, filteredArtistReleases);

      if (release.spotifyId) {
        await spark.kv.delete(`${this.RELEASE_BY_SPOTIFY_PREFIX}${release.spotifyId}`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting release ${id}:`, error);
      return false;
    }
  }

  async getRecentReleases(since: Date): Promise<Release[]> {
    try {
      const allReleases = await this.getAll();
      return allReleases.filter(release => {
        const releaseDate = new Date(release.releaseDate);
        return releaseDate >= since;
      });
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      return [];
    }
  }
}
