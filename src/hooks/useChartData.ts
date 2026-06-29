import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, Genre } from '@/types';
import { useDataService } from '@/contexts/DataContext';
import { trackEnrichmentService } from '@/services/trackEnrichmentService';
import { nightlySyncService } from '@/services/nightlySyncService';
import { safeFilter, safeSlice } from '@/lib/safe-utils';

let nightlySyncInitialized = false;

async function enrichTracksInBackground(
  fan: Track[],
  expert: Track[],
  allTracks: Track[],
  onUpdate: (fan: Track[], expert: Track[]) => void
) {
  if (!trackEnrichmentService || allTracks.length === 0) return;

  try {
    trackEnrichmentService.startBackgroundSync(allTracks);
    const enrichedTracks = await trackEnrichmentService.enrichTracks(allTracks);
    const enrichedMap = new Map(enrichedTracks.map((t) => [t.id, t]));

    onUpdate(
      fan.map((t) => enrichedMap.get(t.id) || t),
      expert.map((t) => enrichedMap.get(t.id) || t)
    );
  } catch (enrichmentError) {
    logger.error('Failed to enrich tracks in background:', enrichmentError);
  }
}

export function useChartData() {
  const dataService = useDataService();
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  useEffect(() => {
    let cancelled = false;

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

        const fan = Array.isArray(data.fanCharts) ? data.fanCharts : [];
        const expert = Array.isArray(data.expertCharts) ? data.expertCharts : [];

        if (cancelled) return;

        setFanCharts(fan);
        setExpertCharts(expert);

        if (fan.length > 0) {
          setCurrentTrack(fan[0]);
        }

        const allTracks = [...fan, ...expert];
        void enrichTracksInBackground(fan, expert, allTracks, (ef, ee) => {
          if (!cancelled) {
            setFanCharts(ef);
            setExpertCharts(ee);
          }
        });

        if (nightlySyncService && !nightlySyncInitialized) {
          nightlySyncInitialized = true;
          try {
            nightlySyncService.initialize();
          } catch (syncError) {
            logger.error('Failed to initialize nightly sync:', syncError);
          }
        }
      } catch (error) {
        logger.error('Failed to load charts:', error);
        if (!cancelled) {
          setFanCharts([]);
          setExpertCharts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCharts();
    return () => {
      cancelled = true;
    };
  }, [dataService]);

  const allGenres: Genre[] = useMemo(() => {
    try {
      const genreSet = new Set<Genre>();
      const allTracks = [...fanCharts, ...expertCharts];

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
  }, [fanCharts, expertCharts]);

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
      return safeSlice(filterByGenre(fanCharts), 0, 20, []);
    } catch (error) {
      logger.error('Error filtering fan charts:', error);
      return [];
    }
  }, [fanCharts, filterByGenre]);

  const filteredExpertCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(expertCharts), 0, 20, []);
    } catch (error) {
      logger.error('Error filtering expert charts:', error);
      return [];
    }
  }, [expertCharts, filterByGenre]);

  const overallChart = useMemo(() => {
    try {
      if (!dataService || typeof dataService.calculateOverallChart !== 'function') {
        return [];
      }

      const chart = dataService.calculateOverallChart();
      if (!Array.isArray(chart) || chart.length === 0) {
        return [];
      }

      return safeSlice(filterByGenre(chart), 0, 20, []);
    } catch (error) {
      logger.error('Error calculating overall chart:', error);
      return [];
    }
  }, [fanCharts, expertCharts, dataService, filterByGenre]);

  return {
    fanCharts,
    expertCharts,
    isLoading,
    currentTrack,
    setCurrentTrack,
    selectedGenres,
    setSelectedGenres,
    allGenres,
    filterByGenre,
    filteredFanCharts,
    filteredExpertCharts,
    overallChart,
    dataService,
  };
}