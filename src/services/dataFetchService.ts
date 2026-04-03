import { Track, OdesliData } from '@/types';

export interface TrackEnrichmentData {
  artworkHighRes?: string;
export interface IData
  fetchArtwork(track: Trac
 

  private cache = new Map<string, Tr

    const cacheKey = `${track.id}-enrichment`;
    if (this.cache.has(cacheKey)) {
    }
 

    const promise = this.performEnrichment(track);

      const result = await promise;

      this.pendingRequests.delete(cacheKey);
  }
  pr

      this.fetchArtwork(track),
     

      enrichmentData.artworkHighRes = artwork

     

      enrichmentData.odesliData = odesliData.value


    try {
      const result = await promise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performEnrichment(track: Track): Promise<TrackEnrichmentData> {
    const enrichmentData: TrackEnrichmentData = {};

    const [artwork, previewUrl, odesliData] = await Promise.allSettled([
      this.fetchArtwork(track),
      this.fetchPreviewUrl(track),
      this.fetchStreamingLinks(track)
    ]);

    if (artwork.status === 'fulfilled' && artwork.value) {
      enrichmentData.artworkHighRes = artwork.value;
    }

    if (previewUrl.status === 'fulfilled' && previewUrl.value) {
      enrichmentData.previewUrl = previewUrl.value;
    }

    if (odesliData.status === 'fulfilled' && odesliData.value) {
      enrichmentData.odesliData = odesliData.value;
    }

    return enrichmentData;
  }

  async fetchArtwork(track: Track): Promise<string | undefined> {
    if (track.artworkHighRes) {

    }

    if (track.albumArt) {
      return track.albumArt;
    }

    return undefined;


  async fetchPreviewUrl(track: Track): Promise<string | undefined> {
    if (track.previewUrl) {
      return track.previewUrl;
    }

    return undefined;


  async fetchStreamingLinks(track: Track): Promise<OdesliData | undefined> {
    if (track.odesliData) {
      return track.odesliData;
    }

    return undefined;



    this.cache.clear();


  getCacheSize(): number {
    return this.cache.size;
  }
}

export const dataFetchService = new DataFetchService();
