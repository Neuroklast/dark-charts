import { Artist } from '../models/Artist'

export interface IArtistRepository {
  getAll(): Promise<Artist[]>
  getById(id: string): Promise<Artist | null>
  getBySpotifyId(spotifyId: string): Promise<Artist | null>
  create(artist: Omit<Artist, 'id'>): Promise<Artist>
  update(id: string, artist: Partial<Artist>): Promise<Artist>
  delete(id: string): Promise<void>
  search(query: string): Promise<Artist[]>
}
