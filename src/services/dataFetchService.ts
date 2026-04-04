import { Track, OdesliData } from '@/types';

export interface TrackEnrichmentData {
  artworkHighRes?: string;
  previewUrl?: string;
  odesliData?: OdesliData;
}

class DataFetchService {
  private cache: Map<string, TrackEnrichmentData> = new Map();
  private pendingRequests: Map<string, Promise<TrackEnrichmentData>> = new Map();

  async enrichTrack(track: Track): Promise<TrackEnrichmentData> {
    if (!track || !track.id) {
      console.warn('Invalid track provided to enrichTrack');
      return {};
    }

    const cacheKey = track.id;
    
    try {
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
    } catch (error) {
      console.error('Error enriching track:', error);
      return {};
    }
  }

  private async performEnrichment(track: Track): Promise<TrackEnrichmentData> {
    try {
      const enrichmentData: TrackEnrichmentData = {};

      const [artwork, previewUrl, odesliData] = await Promise.allSettled([
        this.fetchArtwork(track),
        this.fetchPreviewUrl(track),
        this.fetchOdesliData(track),
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
    } catch (error) {
      console.error('Error in performEnrichment:', error);
      return {};
    }
  }

  async fetchArtwork(track: Track): Promise<string | undefined> {
    try {
      if (!track) {
        return undefined;
      }

      if (track.artworkHighRes) {
        return track.artworkHighRes;
      }

      if (track.artwork) {
        return track.artwork;
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching artwork:', error);
      return undefined;
    }
  }

  async fetchPreviewUrl(track: Track): Promise<string | undefined> {
    try {
      if (!track) {
        return undefined;
      }

      if (track.previewUrl) {
        return track.previewUrl;
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching preview URL:', error);
      return undefined;
    }
  }

  async fetchOdesliData(track: Track): Promise<OdesliData | undefined> {
    try {
      if (!track) {
        return undefined;
      }

      if (track.odesliData) {
        return track.odesliData;
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching Odesli data:', error);
      return undefined;
    }
  }

  clearCache(): void {
    try {
      this.cache.clear();
      this.pendingRequests.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  getCacheSize(): number {
    try {
      return this.cache.size;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }
}

export const dataFetchService = new DataFetchService();
