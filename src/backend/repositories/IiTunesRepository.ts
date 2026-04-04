export interface iTunesSearchResult {
  resultCount: number;
  results: Array<{
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName?: string;
    artworkUrl30?: string;
    artworkUrl60?: string;
    artworkUrl100?: string;
    releaseDate?: string;
    primaryGenreName?: string;
    country?: string;
  }>;
}

export interface IiTunesRepository {
  getHighResArtwork(artistName: string, trackTitle: string): Promise<string | null>;
}
