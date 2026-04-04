import { toast } from 'sonner';

export interface Artist {
  name: string;
  members: string;
  country: string;
  label: string;
  spotifyId: string;
  verified?: boolean;
  latestRelease?: {
    name: string;
    releaseDate: string;
    spotifyUrl: string;
    popularity: number;
  };
}

const SPOTIFY_CLIENT_ID = '4c8f5e4f0e4e4e4e4e4e4e4e4e4e4e4e';
const SPOTIFY_CLIENT_SECRET = '4c8f5e4f0e4e4e4e4e4e4e4e4e4e4e4e';
let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getSpotifyAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

export async function verifySpotifyArtistId(artistId: string): Promise<boolean> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Error verifying Spotify artist ID:', error);
    return false;
  }
}

export async function searchSpotifyArtist(artistName: string): Promise<string> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search Spotify artist');
    }

    const data = await response.json();
    if (data.artists && data.artists.items && data.artists.items.length > 0) {
      return data.artists.items[0].id;
    }

    return '';
  } catch (error) {
    console.error('Error searching Spotify artist:', error);
    return '';
  }
}

export async function getArtistDetails(artistId: string): Promise<any> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get artist details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting artist details:', error);
    return null;
  }
}

export async function getArtistLatestAlbum(artistId: string): Promise<any> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=DE&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get artist albums');
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const sortedAlbums = data.items.sort((a: any, b: any) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
      return sortedAlbums[0];
    }

    return null;
  } catch (error) {
    console.error(`Error getting latest album for artist ${artistId}:`, error);
    return null;
  }
}

export async function parseCSV(csvText: string): Promise<Artist[]> {
  const lines = csvText.trim().split('\n');
  const artists: Artist[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/("(?:[^"]|"")*"|[^,]*)/g);
    
    if (!matches || matches.length < 5) continue;

    const cleanField = (field: string) => {
      return field.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    };

    const artist: Artist = {
      name: cleanField(matches[0] || ''),
      members: cleanField(matches[1] || ''),
      country: cleanField(matches[2] || ''),
      label: cleanField(matches[3] || ''),
      spotifyId: cleanField(matches[4] || ''),
      verified: false
    };

    if (artist.name && artist.spotifyId) {
      artists.push(artist);
    }
  }

  return artists;
}

export async function verifyAndCorrectArtists(artists: Artist[]): Promise<{ artists: Artist[], corrections: any[] }> {
  const corrections: any[] = [];
  const verifiedArtists: Artist[] = [];

  toast.info(`Verifiziere ${artists.length} Artists...`);

  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    
    if (i % 10 === 0) {
      toast.info(`Fortschritt: ${i}/${artists.length} Artists verifiziert`);
    }

    const isValid = await verifySpotifyArtistId(artist.spotifyId);

    if (isValid) {
      artist.verified = true;
      verifiedArtists.push(artist);
    } else {
      console.warn(`Invalid Spotify ID for ${artist.name}: ${artist.spotifyId}`);
      
      const correctedId = await searchSpotifyArtist(artist.name);
      
      if (correctedId) {
        corrections.push({
          artistName: artist.name,
          oldId: artist.spotifyId,
          newId: correctedId
        });
        
        artist.spotifyId = correctedId;
        artist.verified = true;
        verifiedArtists.push(artist);
      } else {
        console.error(`Could not find Spotify ID for ${artist.name}`);
        artist.verified = false;
        verifiedArtists.push(artist);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  toast.success(`Verifizierung abgeschlossen: ${verifiedArtists.filter(a => a.verified).length}/${artists.length} Artists verifiziert`);

  return { artists: verifiedArtists, corrections };
}

export function generateCorrectedCSV(artists: Artist[]): string {
  const header = 'Artist Name,Members,Country,Label,Spotify Artist ID\n';
  const rows = artists.map(artist => {
    const escape = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    return [
      escape(artist.name),
      escape(artist.members),
      escape(artist.country),
      escape(artist.label),
      escape(artist.spotifyId)
    ].join(',');
  });

  return header + rows.join('\n');
}

export async function enrichArtistsWithLatestReleases(artists: Artist[]): Promise<Artist[]> {
  toast.info('Lade aktuelle Releases...');

  const enrichedArtists: Artist[] = [];

  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    
    if (i % 10 === 0) {
      toast.info(`Fortschritt: ${i}/${artists.length} Releases geladen`);
    }

    if (!artist.verified || !artist.spotifyId) {
      enrichedArtists.push(artist);
      continue;
    }

    try {
      const latestAlbum = await getArtistLatestAlbum(artist.spotifyId);

      if (latestAlbum) {
        const albumTracksResponse = await getSpotifyAccessToken().then(token =>
          fetch(`https://api.spotify.com/v1/albums/${latestAlbum.id}/tracks?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        );

        const albumTracksData = await albumTracksResponse.json();
        const firstTrack = albumTracksData.items?.[0];

        if (firstTrack) {
          artist.latestRelease = {
            name: firstTrack.name,
            releaseDate: latestAlbum.release_date,
            spotifyUrl: `https://open.spotify.com/track/${firstTrack.id}`,
            popularity: 50
          };
        }
      }

      enrichedArtists.push(artist);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error enriching artist ${artist.name}:`, error);
      enrichedArtists.push(artist);
    }
  }

  toast.success(`${enrichedArtists.filter(a => a.latestRelease).length} Releases geladen`);

  return enrichedArtists;
}

class ArtistDatabaseService {
  private artists: Artist[] = [];

  async loadCSV(csvText: string): Promise<void> {
    this.artists = await parseCSV(csvText);
    toast.success(`${this.artists.length} Artists aus CSV geladen`);
  }

  async verifyAndCorrect(): Promise<any[]> {
    const result = await verifyAndCorrectArtists(this.artists);
    this.artists = result.artists;
    return result.corrections;
  }

  async enrichWithReleases(): Promise<void> {
    this.artists = await enrichArtistsWithLatestReleases(this.artists);
  }

  getArtists(): Artist[] {
    return this.artists;
  }

  getCorrectedCSV(): string {
    return generateCorrectedCSV(this.artists);
  }

  async saveToKV(key: string = 'darkcharts-artists'): Promise<void> {
    try {
      await spark.kv.set(key, this.artists);
      toast.success('Artists in Datenbank gespeichert');
    } catch (error) {
      console.error('Error saving artists to KV:', error);
      toast.error('Fehler beim Speichern der Artists');
    }
  }

  async loadFromKV(key: string = 'darkcharts-artists'): Promise<void> {
    try {
      const data = await spark.kv.get<Artist[]>(key);
      if (data) {
        this.artists = data;
        toast.success(`${this.artists.length} Artists aus Datenbank geladen`);
      }
    } catch (error) {
      console.error('Error loading artists from KV:', error);
      toast.error('Fehler beim Laden der Artists');
    }
  }
}

export const artistDatabaseService = new ArtistDatabaseService();
