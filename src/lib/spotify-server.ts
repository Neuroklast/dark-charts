/**
 * Server-side Spotify Web API client using Client Credentials flow.
 */

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

interface SpotifyArtistResponse {
  id: string;
  name: string;
  popularity: number;
  followers: { total: number };
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  preview_url: string | null;
}

export interface ArtistStreamingData {
  spotifyId: string;
  name: string;
  popularity: number;
  followerCount: number;
  topTrackAvgPopularity: number;
  genres: string[];
}

const BASE_URL = 'https://api.spotify.com/v1';
const AUTH_URL = 'https://accounts.spotify.com/api/token';

let tokenCache: TokenCache | null = null;

export async function getSpotifyClientCredentialsToken(): Promise<{
  access_token: string;
  expires_in: number;
}> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return {
      access_token: tokenCache.accessToken,
      expires_in: Math.floor((tokenCache.expiresAt - Date.now()) / 1000),
    };
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };

  return data;
}

async function authenticate(): Promise<string> {
  const data = await getSpotifyClientCredentialsToken();
  return data.access_token;
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await authenticate();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return spotifyFetch<T>(path);
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getArtistDetails(spotifyId: string): Promise<SpotifyArtistResponse> {
  return spotifyFetch<SpotifyArtistResponse>(`/artists/${spotifyId}`);
}

export async function getArtistTopTracks(
  spotifyId: string,
  market: string = 'DE'
): Promise<SpotifyTrackResponse[]> {
  const data = await spotifyFetch<{ tracks: SpotifyTrackResponse[] }>(
    `/artists/${spotifyId}/top-tracks?market=${market}`
  );
  return data.tracks;
}

export async function getArtistStreamingData(spotifyId: string): Promise<ArtistStreamingData> {
  const [artist, topTracks] = await Promise.all([
    getArtistDetails(spotifyId),
    getArtistTopTracks(spotifyId),
  ]);

  const avgTrackPopularity =
    topTracks.length > 0
      ? topTracks.reduce((sum, t) => sum + t.popularity, 0) / topTracks.length
      : 0;

  return {
    spotifyId: artist.id,
    name: artist.name,
    popularity: artist.popularity,
    followerCount: artist.followers.total,
    topTrackAvgPopularity: Math.round(avgTrackPopularity),
    genres: artist.genres,
  };
}

export function isSpotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}