import { Release, ReleaseTrack, Artist } from '@/types';

interface SpotifyAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  album_type: 'album' | 'single' | 'compilation';
  images: { url: string; height: number; width: number }[];
  uri: string;
  tracks?: {
    items: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  uri: string;
  preview_url?: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; height: number; width: number }[];
}

class SpotifyService {
  private readonly CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
  private readonly REDIRECT_URI = `${window.location.origin}/spotify-callback`;
  private readonly SCOPES = [
    'user-read-email',
    'user-read-private',
    'user-library-read'
  ].join(' ');
  
  private readonly API_BASE = 'https://api.spotify.com/v1';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly MAX_REQUESTS_PER_SECOND = 10;

  async initiateAuth(): Promise<void> {
    const state = this.generateRandomString(16);
    await spark.kv.set('spotify-auth-state', state);

    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      state: state,
      scope: this.SCOPES,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      const savedState = await spark.kv.get<string>('spotify-auth-state');
      if (state !== savedState) {
        throw new Error('State mismatch');
      }

      const tokens = await this.exchangeCodeForTokens(code);
      await this.saveTokens(tokens);
      await spark.kv.delete('spotify-auth-state');
      
      return true;
    } catch (error) {
      console.error('Spotify callback error:', error);
      return false;
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<SpotifyAuthTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
  }

  private async saveTokens(tokens: SpotifyAuthTokens): Promise<void> {
    await spark.kv.set('spotify-tokens', tokens);
  }

  private async getTokens(): Promise<SpotifyAuthTokens | null> {
    return await spark.kv.get<SpotifyAuthTokens>('spotify-tokens');
  }

  private async refreshAccessToken(): Promise<string> {
    const tokens = await this.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: this.CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newTokens: SpotifyAuthTokens = {
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    await this.saveTokens(newTokens);
    return newTokens.accessToken;
  }

  private async getAccessToken(): Promise<string> {
    const tokens = await this.getTokens();
    if (!tokens) {
      throw new Error('Not authenticated with Spotify');
    }

    if (Date.now() >= tokens.expiresAt - 60000) {
      return await this.refreshAccessToken();
    }

    return tokens.accessToken;
  }

  private async throttledRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      if (now - this.windowStart >= 1000) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      if (this.requestCount >= this.MAX_REQUESTS_PER_SECOND) {
        await new Promise(resolve => setTimeout(resolve, 1000 - (now - this.windowStart)));
        continue;
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  private async spotifyFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.throttledRequest(async () => {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await this.refreshAccessToken();
          const retryResponse = await fetch(`${this.API_BASE}${endpoint}`, {
            ...options,
            headers: {
              ...options?.headers,
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Spotify API error: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        }
        
        throw new Error(`Spotify API error: ${response.status}`);
      }

      return await response.json();
    });
  }

  async searchArtist(query: string): Promise<SpotifyArtist[]> {
    try {
      const data = await this.spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
        `/search?q=${encodeURIComponent(query)}&type=artist&limit=10`
      );
      return data.artists.items;
    } catch (error) {
      console.error('Failed to search artist:', error);
      return [];
    }
  }

  async getArtist(spotifyId: string): Promise<SpotifyArtist | null> {
    try {
      return await this.spotifyFetch<SpotifyArtist>(`/artists/${spotifyId}`);
    } catch (error) {
      console.error('Failed to get artist:', error);
      return null;
    }
  }

  async getArtistAlbums(spotifyId: string, limit = 50): Promise<SpotifyAlbum[]> {
    try {
      const data = await this.spotifyFetch<{ items: SpotifyAlbum[] }>(
        `/artists/${spotifyId}/albums?include_groups=album,single,ep&limit=${limit}&market=DE`
      );
      return data.items;
    } catch (error) {
      console.error('Failed to get artist albums:', error);
      return [];
    }
  }

  async getAlbumDetails(albumId: string): Promise<SpotifyAlbum | null> {
    try {
      return await this.spotifyFetch<SpotifyAlbum>(`/albums/${albumId}`);
    } catch (error) {
      console.error('Failed to get album details:', error);
      return null;
    }
  }

  async syncArtistReleases(artist: Artist): Promise<Release[]> {
    if (!artist.spotifyId) {
      throw new Error('Artist has no Spotify ID');
    }

    try {
      const albums = await this.getArtistAlbums(artist.spotifyId);
      const releases: Release[] = [];

      for (const album of albums) {
        const albumDetails = await this.getAlbumDetails(album.id);
        if (!albumDetails) continue;

        const tracks: ReleaseTrack[] = albumDetails.tracks?.items.map(track => ({
          id: track.id,
          title: track.name,
          duration: track.duration_ms,
          trackNumber: track.track_number,
          spotifyUri: track.uri,
          previewUrl: track.preview_url,
        })) || [];

        const release: Release = {
          id: `spotify-release-${album.id}`,
          artistId: artist.id,
          artistName: artist.name,
          title: album.name,
          releaseDate: album.release_date,
          albumArt: album.images[0]?.url,
          spotifyUri: album.uri,
          type: album.album_type === 'compilation' ? 'album' : album.album_type,
          tracks,
          createdAt: Date.now(),
          lastCached: Date.now(),
        };

        releases.push(release);
        await spark.kv.set(`release:${release.id}`, release);
      }

      return releases;
    } catch (error) {
      console.error('Failed to sync artist releases:', error);
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      const data = await this.spotifyFetch<any>(`/playlists/${playlistId}`);
      return data;
    } catch (error) {
      console.error('Failed to get playlist:', error);
      return null;
    }
  }

  async getTrackDetails(spotifyTrackId: string): Promise<{
    previewUrl?: string;
    albumArt?: string;
    isrc?: string;
  } | null> {
    try {
      const data = await this.spotifyFetch<{
        preview_url?: string;
        album: { images: { url: string }[] };
        external_ids: { isrc?: string };
      }>(`/tracks/${spotifyTrackId}`);

      return {
        previewUrl: data.preview_url,
        albumArt: data.album.images[0]?.url,
        isrc: data.external_ids.isrc,
      };
    } catch (error) {
      console.error('Failed to get track details:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return !!tokens?.accessToken;
  }

  async logout(): Promise<void> {
    await spark.kv.delete('spotify-tokens');
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }
}

export const spotifyService = new SpotifyService();
