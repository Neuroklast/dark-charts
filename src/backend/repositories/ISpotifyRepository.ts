import { SpotifyAlbum, SpotifyArtistAlbumsResponse } from '../models/Release';

export interface ISpotifyRepository {
  authenticate(): Promise<string>;
  getArtistAlbums(spotifyArtistId: string, accessToken: string): Promise<SpotifyAlbum[]>;
}
