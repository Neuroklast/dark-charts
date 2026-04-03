import { useEffect, useState } from 'react';
import { artworkCacheService } from '@/services/artworkCacheService';
import { Track } from '@/types';

export function useArtworkPreloader(tracks: Track[], priority: number = 5) {
  const [stats, setStats] = useState(artworkCacheService.getCacheStats());

  useEffect(() => {
    if (tracks.length === 0) return;

    const artworkUrls = tracks
      .filter(track => track.albumArt || track.artworkHighRes)
      .map(track => track.artworkHighRes || track.albumArt)
      .filter((url): url is string => !!url);

    if (artworkUrls.length > 0) {
      artworkCacheService.preloadMultiple(artworkUrls, priority);
    }

    const interval = setInterval(() => {
      setStats(artworkCacheService.getCacheStats());
    }, 500);

    return () => clearInterval(interval);
  }, [tracks, priority]);

  return stats;
}

export function useUpcomingTrackPreloader(currentTrack: Track | null, allTracks: Track[], lookAhead: number = 3) {
  useEffect(() => {
    if (!currentTrack || allTracks.length === 0) return;

    artworkCacheService.preloadUpcomingTracks(currentTrack, allTracks, lookAhead);
  }, [currentTrack, allTracks, lookAhead]);
}

export function useVisibleTracksPreloader(visibleTracks: Track[], priority: number = 8) {
  useEffect(() => {
    if (visibleTracks.length === 0) return;

    artworkCacheService.preloadVisibleTracks(visibleTracks, priority);
  }, [visibleTracks, priority]);
}

export function useArtworkCache(url?: string, priority: number = 1) {
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsCached(false);
      return;
    }

    if (artworkCacheService.isCached(url)) {
      setIsCached(true);
      return;
    }

    artworkCacheService.preloadArtwork(url, priority).then(() => {
      setIsCached(true);
    });
  }, [url, priority]);

  return isCached;
}
