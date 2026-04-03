import { useEffect } from 'react';
import { artworkCacheService } from '@/services/artworkCacheService';
import { Track } from '@/types';

export function useArtworkPreloader(tracks: Track[]) {
  useEffect(() => {
    if (tracks.length === 0) return;

    const artworkUrls = tracks
      .filter(track => track.albumArt || track.artworkHighRes)
      .map(track => track.artworkHighRes || track.albumArt)
      .filter((url): url is string => !!url);

    if (artworkUrls.length > 0) {
      artworkCacheService.preloadMultiple(artworkUrls);
    }
  }, [tracks]);

  return artworkCacheService.getCacheStats();
}

export function useArtworkCache(url?: string) {
  useEffect(() => {
    if (url) {
      artworkCacheService.preloadArtwork(url);
    }
  }, [url]);

  return url ? artworkCacheService.isCached(url) : false;
}
