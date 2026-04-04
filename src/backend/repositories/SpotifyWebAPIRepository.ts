import { ISpotifyRepository } from './ISpotifyRepository';
import { SpotifyAlbum, SpotifyArtistAlbumsResponse } from '../models/Release';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export class SpotifyWebAPIRepository implements ISpotifyRepository {
  private readonly BASE_URL = 'https://api.spotify.com/v1';
  private readonly AUTH_URL = 'https://accounts.spotify.com/api/token';
  private readonly TOKEN_CACHE_KEY = 'backend:spotify:access_token';
  private readonly RATE_LIMIT_DELAY = 100;
  private lastRequestTime = 0;

  private async getClientCredentials(): Promise<{ clientId: string; clientSecret: string }> {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      throw new Error('Spotify Client ID and Secret must be configured in environment variables');
    }

    return { clientId, clientSecret };
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  async authenticate(): Promise<string> {
    try {
      const cached = await spark.kv.get<TokenCacheEntry>(this.TOKEN_CACHE_KEY);
      
      if (cached && cached.expiresAt > Date.now()) {
        return cached.token;
      }

      const { clientId, clientSecret } = await this.getClientCredentials();
      
      const authString = btoa(`${clientId}:${clientSecret}`);
      
      const response = await fetch(this.AUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const cacheEntry: TokenCacheEntry = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000
      };
      
      await spark.kv.set(this.TOKEN_CACHE_KEY, cacheEntry);
      
      return data.access_token;
    } catch (error) {
      console.error('Error during Spotify authentication:', error);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  async getArtistAlbums(spotifyArtistId: string, accessToken: string): Promise<SpotifyAlbum[]> {
    const allAlbums: SpotifyAlbum[] = [];
    let nextUrl: string | null = `${this.BASE_URL}/artists/${spotifyArtistId}/albums?include_groups=album,single,ep&limit=50`;

    try {
      while (nextUrl) {
        await this.waitForRateLimit();

        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          console.warn(`Rate limited by Spotify. Waiting ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Spotify API request failed: ${response.status} ${response.statusText}`);
        }

        const data: SpotifyArtistAlbumsResponse = await response.json();
        
        allAlbums.push(...data.items);
        
        nextUrl = data.next;
      }

      return allAlbums;
    } catch (error) {
      console.error(`Error fetching albums for artist ${spotifyArtistId}:`, error);
      throw error;
    }
  }
}
