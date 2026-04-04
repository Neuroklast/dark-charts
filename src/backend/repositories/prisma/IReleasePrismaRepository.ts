import { Release } from '../models/Release'

export interface IReleasePrismaRepository {
  getAll(): Promise<Release[]>
  getById(id: string): Promise<Release | null>
  getBySpotifyId(spotifyId: string): Promise<Release | null>
  getByArtistId(artistId: string): Promise<Release[]>
  create(release: Omit<Release, 'id'>): Promise<Release>
  update(id: string, release: Partial<Release>): Promise<Release>
  delete(id: string): Promise<void>
  getRecentReleases(limit: number): Promise<Release[]>
}
