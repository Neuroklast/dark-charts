/**
 * iTunes Search / Lookup API client.
 * Artwork URLs are upgraded to 3000×3000 where possible.
 */

export interface iTunesCollection {
  wrapperType?: string;
  collectionId: number;
  collectionName: string;
  artistId: number;
  artistName: string;
  artworkUrl100: string;
  artworkUrl600?: string;
  releaseDate: string;
  collectionType: string;
  trackCount: number;
  primaryGenreName: string;
  collectionViewUrl: string;
}

export interface iTunesSongResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  collectionViewUrl?: string;
}

export function upgradeArtworkUrl(url: string): string {
  return url.replace(/\d+x\d+bb(\.\w+)$/, '3000x3000bb$1');
}

export function pickArtworkUrl(
  urls: { artworkUrl600?: string; artworkUrl100?: string; artworkUrl60?: string; artworkUrl30?: string }
): string | null {
  const raw =
    urls.artworkUrl600 ??
    urls.artworkUrl100 ??
    urls.artworkUrl60 ??
    urls.artworkUrl30;
  return raw ? upgradeArtworkUrl(raw) : null;
}

export function extractItunesArtistId(profileLink: string | null | undefined): string | null {
  if (!profileLink) return null;
  const match = profileLink.match(/\/artist\/[^/]+\/(\d+)(?:[?#].*)?$/);
  return match?.[1] ?? null;
}

export async function lookupItunesArtistAlbums(
  artistName: string,
  fetchFn: typeof fetch = globalThis.fetch,
  itunesArtistId?: string | null
): Promise<iTunesCollection[]> {
  let artistId = itunesArtistId ?? null;

  if (!artistId) {
    const searchResponse = await fetchFn(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&attribute=artistTerm&limit=5`
    );
    if (!searchResponse.ok) {
      throw new Error(`iTunes search failed: ${searchResponse.status}`);
    }
    const searchData = (await searchResponse.json()) as {
      results: Array<{ artistId: number; artistName: string }>;
    };
    const match = searchData.results.find(
      (r) => r.artistName.toLowerCase() === artistName.toLowerCase()
    );
    artistId = match?.artistId ? String(match.artistId) : null;
  }

  if (!artistId) return [];

  const lookupResponse = await fetchFn(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(artistId)}&entity=album&limit=200`
  );
  if (!lookupResponse.ok) {
    throw new Error(`iTunes lookup failed: ${lookupResponse.status}`);
  }

  const lookupData = (await lookupResponse.json()) as {
    results: iTunesCollection[];
  };

  return (lookupData.results ?? [])
    .filter((r) => r.wrapperType === 'collection' || r.collectionType)
    .map((r) => ({
      ...r,
      artworkUrl100: upgradeArtworkUrl(r.artworkUrl100),
      artworkUrl600: r.artworkUrl600 ? upgradeArtworkUrl(r.artworkUrl600) : r.artworkUrl600,
    }));
}

export async function searchItunesSongArtwork(
  artistName: string,
  trackTitle: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<{ artworkUrl: string; collectionViewUrl?: string } | null> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${trackTitle}`)}&media=music&entity=song&limit=10`;

  const response = await fetchFn(url, {
    headers: { 'User-Agent': 'DarkCharts/1.0' },
  });

  if (!response.ok) {
    throw new Error(`iTunes song search failed: ${response.status}`);
  }

  const data = (await response.json()) as { results: iTunesSongResult[] };
  if (!data.results?.length) return null;

  const normalizedArtist = normalize(artistName);
  const normalizedTrack = normalize(trackTitle);

  const best =
    data.results.find(
      (r) =>
        fuzzyMatch(normalize(r.artistName), normalizedArtist) &&
        fuzzyMatch(normalize(r.trackName), normalizedTrack)
    ) ?? data.results.find((r) => fuzzyMatch(normalize(r.artistName), normalizedArtist)) ?? data.results[0];

  const artworkUrl = pickArtworkUrl(best);
  if (!artworkUrl) return null;

  return { artworkUrl, collectionViewUrl: best.collectionViewUrl };
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || a === b;
}