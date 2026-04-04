import { Release, CreateReleaseDTO } from '../models/Release';

export interface IReleaseRepository {
  getAll(): Promise<Release[]>;
  getById(id: string): Promise<Release | null>;
  getByArtistId(artistId: string): Promise<Release[]>;
  getBySpotifyId(spotifyId: string): Promise<Release | null>;
  exists(artistId: string, title: string, releaseDate: Date): Promise<boolean>;
  create(dto: CreateReleaseDTO): Promise<Release>;
  update(id: string, data: Partial<Release>): Promise<Release | null>;
  delete(id: string): Promise<boolean>;
  getRecentReleases(since: Date): Promise<Release[]>;
}
