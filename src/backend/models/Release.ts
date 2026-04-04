export interface Release {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: Date;
  albumType: 'album' | 'single' | 'ep' | 'compilation';
  totalTracks: number;
  spotifyId?: string;
  spotifyUrl?: string;
  artworkUrl?: string;
  genres: string[];
  isrc?: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReleaseDTO {
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: Date;
  albumType: 'album' | 'single' | 'ep' | 'compilation';
  totalTracks: number;
  spotifyId?: string;
  spotifyUrl?: string;
  artworkUrl?: string;
  genres: string[];
  isrc?: string;
  label?: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  artists: Array<{
    id: string;
    name: string;
  }>;
  label?: string;
}

export interface SpotifyArtistAlbumsResponse {
  items: SpotifyAlbum[];
  next: string | null;
  total: number;
  limit: number;
  offset: number;
}
