import { Track, OdesliData } from '@/types';

export interface TrackEnrichmentData {
  artworkHighRes?: string;
class DataFetchService
  private pendingRequests 
 

      return this.cache.

      return this.pendingRequests.get(cacheKey)!;

    this.pendingRequests.set(cacheKey, promise);
    try {
    
    } finally {
      return this.cache.get(cacheKey)!;


    const [artwork, previewUrl, odesliData] =
      this.fetchPreviewUrl(track),
    ]

    }
    if (previewUrl.status === 'fulfilled' && pre

    if (o
    }
    return enrichmentData;

    if (track.a
    }
    i
   


    if (track.previewUrl) {

    return undefined;

    if (track.odesliData) {
    }
    ret

    this.cache.clear();

    r

export const dataFetchService = new DataFetchService();
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


































