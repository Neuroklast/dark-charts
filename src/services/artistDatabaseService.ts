import { toast } from 'sonner';

export interface Artist {
  name: string;
  members?: string;
  country: string;
  label: string;
  spotifyId: string;
  verified?: boolean;
  latestRelease?: {
    title: string;
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

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;
    return accessToken!;
  } catch (error) {
    console.error('Spotify Auth Error:', error);
    throw new Error('Spotify Authentifizierung fehlgeschlagen');
  }
}

export async function getLatestAlbum(artistId: string): Promise<any> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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

  const cleanField = (field: string) => {
    return (field || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/("(?:[^"]|"")*"|[^,]*)/g);
    
    if (!matches || matches.length < 5) continue;

    artists.push({
      name: cleanField(matches[0]),
      members: cleanField(matches[1]),
      country: cleanField(matches[2]),
      label: cleanField(matches[3]),
      spotifyId: cleanField(matches[4]),
      verified: false
    });
  }
  return artists;
}

export function generateCSV(artists: Artist[]): string {
  const header = 'Artist Name,Members,Country,Label,Spotify ID\n';
  const escape = (text: string) => {
    const clean = (text || '').replace(/"/g, '""');
    return clean.includes(',') || clean.includes('"') ? `"${clean}"` : clean;
  };

  const rows = artists.map(artist => [
    escape(artist.name),
    escape(artist.members || ''),
    escape(artist.country),
    escape(artist.label),
    escape(artist.spotifyId)
  ].join(','));

  return header + rows.join('\n');
}

class ArtistDatabaseService {
  private artists: Artist[] = [];

  async loadFromKV(key: string = 'darkcharts-artists'): Promise<void> {
    try {
      // @ts-ignore - spark global context
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

  async saveToKV(key: string = 'darkcharts-artists'): Promise<void> {
    try {
      // @ts-ignore - spark global context
      await spark.kv.put(key, this.artists);
      toast.success('Daten erfolgreich gespeichert');
    } catch (error) {
      console.error('Error saving artists to KV:', error);
      toast.error('Fehler beim Speichern');
    }
  }

  getArtists() {
    return this.artists;
  }

  async loadFromCSV(csvText: string): Promise<void> {
    this.artists = await parseCSV(csvText);
  }

  async verifyAndCorrect(): Promise<{ artistName: string; oldId: string; newId: string }[]> {
    // TODO: Implement Spotify ID verification logic
    throw new Error('verifyAndCorrect() is not yet implemented');
  }

  async enrichWithReleases(): Promise<void> {
    // TODO: Implement release enrichment via Spotify API
    throw new Error('enrichWithReleases() is not yet implemented');
  }

  getCorrectedCSV(): string {
    return generateCSV(this.artists);
  }
}

export const artistDatabaseService = new ArtistDatabaseService();