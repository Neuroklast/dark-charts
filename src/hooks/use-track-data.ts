import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/types';
import { dataFetchService, TrackEnrichmentData } from '@/services/dataFetchService';

interface UseTrackDataResult {
  enrichedTrack: Track | null;
  isLoadingArtwork: boolean;
  isLoadingPreview: boolean;
  isLoadingStreamingLinks: boolean;
  artworkUrl: string | undefined;
  previewUrl: string | undefined;
  hasStreamingLinks: boolean;
  refresh: () => Promise<void>;
}

export function useTrackData(track: Track | null): UseTrackDataResult {
  const [enrichedTrack, setEnrichedTrack] = useState<Track | null>(track);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingStreamingLinks, setIsLoadingStreamingLinks] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<TrackEnrichmentData | null>(null);

  const enrichTrack = useCallback(async (trackToEnrich: Track) => {
    setIsLoadingArtwork(true);
    setIsLoadingPreview(true);
    setIsLoadingStreamingLinks(true);

    try {
      const data = await dataFetchService.enrichTrackData(trackToEnrich);
      setEnrichmentData(data);

      const enriched: Track = {
        ...trackToEnrich,
        artworkHighRes: data.artworkHighRes || trackToEnrich.artworkHighRes,
        previewUrl: data.previewUrl || trackToEnrich.previewUrl,
        odesliData: data.odesliData || trackToEnrich.odesliData,
      };

      setEnrichedTrack(enriched);
    } catch (error) {
      console.error('Failed to enrich track data:', error);
      setEnrichedTrack(trackToEnrich);
    } finally {
      setIsLoadingArtwork(false);
      setIsLoadingPreview(false);
      setIsLoadingStreamingLinks(false);
    }
  }, []);

  useEffect(() => {
    if (!track) {
      setEnrichedTrack(null);
      setEnrichmentData(null);
      setIsLoadingArtwork(false);
      setIsLoadingPreview(false);
      setIsLoadingStreamingLinks(false);
      return;
    }

    enrichTrack(track);
  }, [track, enrichTrack]);

  const refresh = useCallback(async () => {
    if (track) {
      await enrichTrack(track);
    }
  }, [track, enrichTrack]);

  const artworkUrl = enrichedTrack?.artworkHighRes || enrichedTrack?.albumArt;
  const previewUrl = enrichedTrack?.previewUrl;
  const hasStreamingLinks = !!(enrichedTrack?.odesliData?.linksByPlatform && 
    Object.keys(enrichedTrack.odesliData.linksByPlatform).length > 0);

  return {
    enrichedTrack,
    isLoadingArtwork,
    isLoadingPreview,
    isLoadingStreamingLinks,
    artworkUrl,
    previewUrl,
    hasStreamingLinks,
    refresh,
  };
}
