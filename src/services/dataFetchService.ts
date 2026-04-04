import { Track, OdesliData } from '@/types';

export interface TrackEnrichmentData {
  artworkHighRes?: string;
  previewUrl?: string;
  odesliData?: OdesliData;
}

class DataFetchService {
  private cache = new Map<string, TrackEnrichmentData>();
  private pendingRequests = new Map<string, Promise<TrackEnrichmentData>>();

  async enrichTrack(track: Track): Promise<TrackEnrichmentData> {
    const cacheKey = `${track.id}-enrichment`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const promise = this.performEnrichment(track);
    this.pendingRequests.set(cacheKey, promise);

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
      return track.artworkHighRes;
    }

    if (track.albumArt) {
      return track.albumArt;
    }

    return undefined;
  }

  async fetchPreviewUrl(track: Track): Promise<string | undefined> {
    if (track.previewUrl) {
      return track.previewUrl;
    }

    return undefined;
  }

  async fetchStreamingLinks(track: Track): Promise<OdesliData | undefined> {
    if (track.odesliData) {
      return track.odesliData;
    }

    return undefined;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const dataFetchService = new DataFetchService();
