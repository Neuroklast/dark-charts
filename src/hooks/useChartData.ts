import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, Genre } from '@/types';
import { useDataService } from '@/contexts/DataContext';
import { trackEnrichmentService } from '@/services/trackEnrichmentService';
import { nightlySyncService } from '@/services/nightlySyncService';
import { safeFilter, safeSlice } from '@/lib/safe-utils';

export function useChartData() {
  const dataService = useDataService();
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      try {
        if (!dataService) {
          throw new Error('DataService not available');
        }

        const data = await dataService.getAllCharts();

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from service');
        }

        const allTracks = [
          ...(Array.isArray(data.fanCharts) ? data.fanCharts : []),
          ...(Array.isArray(data.expertCharts) ? data.expertCharts : []),
          ...(Array.isArray(data.streamingCharts) ? data.streamingCharts : [])
        ];

        if (trackEnrichmentService && allTracks.length > 0) {
          try {
            const enrichedTracks = await trackEnrichmentService.enrichTracks(allTracks);
            const enrichedMap = new Map(enrichedTracks.map(t => [t.id, t]));

            const enrichedFanCharts = (data.fanCharts || []).map((t: Track) => enrichedMap.get(t.id) || t);
            const enrichedExpertCharts = (data.expertCharts || []).map((t: Track) => enrichedMap.get(t.id) || t);
            const enrichedStreamingCharts = (data.streamingCharts || []).map((t: Track) => enrichedMap.get(t.id) || t);

            setFanCharts(enrichedFanCharts);
            setExpertCharts(enrichedExpertCharts);
            setStreamingCharts(enrichedStreamingCharts);

            if (enrichedFanCharts.length > 0) {
              setCurrentTrack(enrichedFanCharts[0]);
            }

            trackEnrichmentService.startBackgroundSync(allTracks);
          } catch (enrichmentError) {
            logger.error('Failed to enrich tracks:', enrichmentError);
            setFanCharts(Array.isArray(data.fanCharts) ? data.fanCharts : []);
            setExpertCharts(Array.isArray(data.expertCharts) ? data.expertCharts : []);
            setStreamingCharts(Array.isArray(data.streamingCharts) ? data.streamingCharts : []);

            if (Array.isArray(data.fanCharts) && data.fanCharts.length > 0) {
              setCurrentTrack(data.fanCharts[0]);
            }
          }
        } else {
          setFanCharts(Array.isArray(data.fanCharts) ? data.fanCharts : []);
          setExpertCharts(Array.isArray(data.expertCharts) ? data.expertCharts : []);
          setStreamingCharts(Array.isArray(data.streamingCharts) ? data.streamingCharts : []);

          if (Array.isArray(data.fanCharts) && data.fanCharts.length > 0) {
            setCurrentTrack(data.fanCharts[0]);
          }
        }

        if (nightlySyncService) {
          try {
            nightlySyncService.initialize();
          } catch (syncError) {
            logger.error('Failed to initialize nightly sync:', syncError);
          }
        }
      } catch (error) {
        logger.error('Failed to load charts:', error);
        setFanCharts([]);
        setExpertCharts([]);
        setStreamingCharts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, [dataService]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];
        if (allTracks.length > 0 && trackEnrichmentService) {
          const enrichedTracks = await trackEnrichmentService.enrichTracks(allTracks);
          const enrichedMap = new Map(enrichedTracks.map(t => [t.id, t]));

          setFanCharts(current => current.map(t => enrichedMap.get(t.id) || t));
          setExpertCharts(current => current.map(t => enrichedMap.get(t.id) || t));
          setStreamingCharts(current => current.map(t => enrichedMap.get(t.id) || t));
        }
      } catch (error) {
        logger.error('Failed to sync tracks:', error);
      }
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fanCharts, expertCharts, streamingCharts]);

  const allGenres: Genre[] = useMemo(() => {
    try {
      const genreSet = new Set<Genre>();
      const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];

      allTracks.forEach(track => {
        if (track && Array.isArray(track.genres)) {
          track.genres.forEach(genre => {
            if (genre) {
              genreSet.add(genre);
            }
          });
        }
      });

      return Array.from(genreSet).sort();
    } catch (error) {
      logger.error('Error computing all genres:', error);
      return [];
    }
  }, [fanCharts, expertCharts, streamingCharts]);

  const filterByGenre = useCallback((tracks: Track[]): Track[] => {
    try {
      if (!Array.isArray(tracks)) {
        return [];
      }

      if (!Array.isArray(selectedGenres) || selectedGenres.length === 0) {
        return tracks;
      }

      return safeFilter(tracks, (track) => {
        if (!track || !Array.isArray(track.genres)) {
          return false;
        }
        return track.genres.some(genre => selectedGenres.includes(genre));
      });
    } catch (error) {
      logger.error('Error filtering by genre:', error);
      return tracks;
    }
  }, [selectedGenres]);

  const filteredFanCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(fanCharts), 0, 10, []);
    } catch (error) {
      logger.error('Error filtering fan charts:', error);
      return [];
    }
  }, [fanCharts, filterByGenre]);

  const filteredExpertCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(expertCharts), 0, 10, []);
    } catch (error) {
      logger.error('Error filtering expert charts:', error);
      return [];
    }
  }, [expertCharts, filterByGenre]);

  const filteredStreamingCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(streamingCharts), 0, 10, []);
    } catch (error) {
      logger.error('Error filtering streaming charts:', error);
      return [];
    }
  }, [streamingCharts, filterByGenre]);

  const overallChart = useMemo(() => {
    try {
      if (!Array.isArray(fanCharts) || fanCharts.length === 0 ||
          !Array.isArray(expertCharts) || expertCharts.length === 0 ||
          !Array.isArray(streamingCharts) || streamingCharts.length === 0) {
        return [];
      }

      if (!dataService || typeof dataService.calculateOverallChart !== 'function') {
        return [];
      }

      const chart = dataService.calculateOverallChart();
      return safeSlice(filterByGenre(chart), 0, 10, []);
    } catch (error) {
      logger.error('Error calculating overall chart:', error);
      return [];
    }
  }, [fanCharts, expertCharts, streamingCharts, dataService, filterByGenre]);

  return {
    fanCharts,
    expertCharts,
    streamingCharts,
    isLoading,
    currentTrack,
    setCurrentTrack,
    selectedGenres,
    setSelectedGenres,
    allGenres,
    filterByGenre,
    filteredFanCharts,
    filteredExpertCharts,
    filteredStreamingCharts,
    overallChart,
    dataService,
  };
}
