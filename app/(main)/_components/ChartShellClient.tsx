'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Track, ChartType, Genre, MainGenre } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { logger } from '@/lib/logger';
import { MusicPlayer } from '@/components/MusicPlayer';
import { TrackDetailModal } from '@/components/TrackDetailModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trackEnrichmentService } from '@/services/trackEnrichmentService';
import { useUpcomingTrackPreloader, useVisibleTracksPreloader } from '@/hooks/use-artwork-cache';
import { safeFilter, safeFindIndex, safeSlice } from '@/lib/safe-utils';
import { mainGenreMap } from '@/lib/config/genres';
import { navigateToChart } from '@/lib/routes';
import { useChartData } from '@/hooks/useChartData';
import { DataSourceBanner } from '@/components/DataSourceBanner';
import { PromotionalSlot } from '@/components/PromotionalSlot';

function shouldShowSpotlight(pathname: string): boolean {
  if (pathname.startsWith('/voting')) return false;
  if (pathname.startsWith('/profile')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/oauth')) return false;
  return true;
}

export interface ChartShellContextValue {
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
  isLoading: boolean;
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  selectedGenres: Genre[];
  setSelectedGenres: React.Dispatch<React.SetStateAction<Genre[]>>;
  filteredFanCharts: Track[];
  filteredExpertCharts: Track[];
  filteredStreamingCharts: Track[];
  overallChart: Track[];
  activePromotion: { type?: string; name?: string; imageUrl?: string } | null;
  hasVoted: boolean;
  setHasVoted: (value: boolean) => void;
  handleTrackClick: (track: Track) => Promise<void>;
  handleToggleGenre: (genre: Genre) => void;
  handleClearFilters: () => void;
  getAllChartPositions: (track: Track) => {
    chartName: string;
    position: number;
    chartType?: ChartType;
    mainGenre?: MainGenre;
    subGenre?: Genre;
  }[];
  handleNavigateToChart: (
    chartType?: ChartType,
    mainGenre?: MainGenre,
    subGenre?: Genre
  ) => void;
}

const ChartShellContext = createContext<ChartShellContextValue | null>(null);

export function useChartShell(): ChartShellContextValue {
  const ctx = useContext(ChartShellContext);
  if (!ctx) {
    throw new Error('useChartShell must be used within ChartShellClient');
  }
  return ctx;
}

interface ChartShellClientProps {
  children: ReactNode;
  visibleTracks?: Track[];
}

function resolveActivePillar(pathname: string): ChartType | 'overview' {
  const match = pathname.match(/^\/charts\/(fan|expert|streaming)$/);
  if (match) return match[1] as ChartType;
  return 'overview';
}

export function ChartShellClient({ children, visibleTracks }: ChartShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activePillar = resolveActivePillar(pathname);
  const { user } = useAuth();
  const [activePromotion, setActivePromotion] = useState<{
    type?: string;
    name?: string;
    imageUrl?: string;
  } | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    fanCharts,
    expertCharts,
    streamingCharts,
    isLoading,
    currentTrack,
    setCurrentTrack,
    selectedGenres,
    setSelectedGenres,
    filteredFanCharts,
    filteredExpertCharts,
    filteredStreamingCharts,
    overallChart,
  } = useChartData();

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.promotions?.length > 0) {
          const promo = data.promotions[0];
          setActivePromotion({
            type: promo.label || promo.type,
            name: promo.name,
            imageUrl: promo.imageUrl,
          });
        }
      })
      .catch((err) => logger.error('Failed to load promotions', err));
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkVoteStatus = async () => {
      try {
        const res = await authFetch('/api/vote/status');
        const data = await res.json();
        if (data.hasVoted) setHasVoted(true);
      } catch (err) {
        logger.error('Failed to check vote status', { error: err });
      }
    };
    checkVoteStatus();
  }, [user]);

  const allTracksForPlayer = useMemo(() => {
    if (activePillar === 'overview') return overallChart;
    if (activePillar === 'fan') return filteredFanCharts;
    if (activePillar === 'expert') return filteredExpertCharts;
    if (activePillar === 'streaming') return filteredStreamingCharts;
    return [...fanCharts, ...expertCharts, ...streamingCharts];
  }, [
    activePillar,
    overallChart,
    filteredFanCharts,
    filteredExpertCharts,
    filteredStreamingCharts,
    fanCharts,
    expertCharts,
    streamingCharts,
  ]);

  const defaultVisibleTracks = useMemo(() => {
    if (activePillar === 'overview') {
      return [
        ...safeSlice(filteredFanCharts, 0, 3, []),
        ...safeSlice(filteredExpertCharts, 0, 3, []),
        ...safeSlice(filteredStreamingCharts, 0, 3, []),
      ];
    }
    if (activePillar === 'fan') return filteredFanCharts;
    if (activePillar === 'expert') return filteredExpertCharts;
    if (activePillar === 'streaming') return filteredStreamingCharts;
    return [];
  }, [activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts]);

  useUpcomingTrackPreloader(currentTrack, allTracksForPlayer, 5);
  useVisibleTracksPreloader(visibleTracks ?? defaultVisibleTracks, 10);

  const handleTrackClick = useCallback(
    async (track: Track) => {
      if (!track) return;
      let enrichedTrack = track;
      if (trackEnrichmentService?.enrichTrack) {
        try {
          enrichedTrack = await trackEnrichmentService.enrichTrack(track);
        } catch (enrichmentError) {
          logger.error('Failed to enrich track:', { error: enrichmentError });
        }
      }
      setSelectedTrackForModal(enrichedTrack);
      setIsModalOpen(true);
      setCurrentTrack(enrichedTrack);
    },
    [setCurrentTrack]
  );

  const handleToggleGenre = useCallback(
    (genre: Genre) => {
      setSelectedGenres((current) => {
        if (!Array.isArray(current)) return [genre];
        if (current.includes(genre)) return safeFilter(current, (g) => g !== genre);
        return [...current, genre];
      });
    },
    [setSelectedGenres]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
  }, [setSelectedGenres]);

  const getAllChartPositions = useCallback(
    (track: Track) => {
      if (!track) return [];
      const positions: {
        chartName: string;
        position: number;
        chartType?: ChartType;
        mainGenre?: MainGenre;
        subGenre?: Genre;
      }[] = [];

      const fanIndex = safeFindIndex(fanCharts, (t) => t?.id === track.id, -1);
      if (fanIndex !== -1 && fanIndex < 10) {
        positions.push({ chartName: 'Fan Charts', position: fanIndex + 1, chartType: 'fan' });
      }
      const expertIndex = safeFindIndex(expertCharts, (t) => t?.id === track.id, -1);
      if (expertIndex !== -1 && expertIndex < 10) {
        positions.push({
          chartName: 'Expert Charts',
          position: expertIndex + 1,
          chartType: 'expert',
        });
      }
      const streamingIndex = safeFindIndex(streamingCharts, (t) => t?.id === track.id, -1);
      if (streamingIndex !== -1 && streamingIndex < 10) {
        positions.push({
          chartName: 'Streaming Charts',
          position: streamingIndex + 1,
          chartType: 'streaming',
        });
      }
      const overallIndex = safeFindIndex(overallChart, (t) => t?.id === track.id, -1);
      if (overallIndex !== -1) {
        positions.push({ chartName: 'Overall Charts', position: overallIndex + 1 });
      }

      Object.entries(mainGenreMap).forEach(([mainGenre, subGenres]) => {
        const mainGenreTracks = safeFilter(
          [...fanCharts, ...expertCharts, ...streamingCharts],
          (t) => t && Array.isArray(t.genres) && t.genres.some((g) => subGenres.includes(g))
        );
        const mainGenreIndex = safeFindIndex(mainGenreTracks, (t) => t?.id === track.id, -1);
        if (mainGenreIndex !== -1 && mainGenreIndex < 10) {
          positions.push({
            chartName: `${mainGenre} Charts`,
            position: mainGenreIndex + 1,
            mainGenre: mainGenre as MainGenre,
          });
        }
        track.genres?.forEach((genre) => {
          if (subGenres.includes(genre)) {
            const subGenreTracks = safeFilter(mainGenreTracks, (t) => t?.genres?.includes(genre));
            const subGenreIndex = safeFindIndex(subGenreTracks, (t) => t?.id === track.id, -1);
            if (subGenreIndex !== -1 && subGenreIndex < 10) {
              positions.push({
                chartName: genre,
                position: subGenreIndex + 1,
                mainGenre: mainGenre as MainGenre,
                subGenre: genre,
              });
            }
          }
        });
      });

      return positions;
    },
    [fanCharts, expertCharts, streamingCharts, overallChart]
  );

  const handleNavigateToChart = useCallback(
    (chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => {
      navigateToChart(router, chartType, mainGenre, subGenre);
    },
    [router]
  );

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = allTracksForPlayer;
    const currentIndex = safeFindIndex(allTracks, (t) => t?.id === currentTrack.id, -1);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, allTracksForPlayer, setCurrentTrack]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = allTracksForPlayer;
    const currentIndex = safeFindIndex(allTracks, (t) => t?.id === currentTrack.id, -1);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, allTracksForPlayer, setCurrentTrack]);

  const value = useMemo<ChartShellContextValue>(
    () => ({
      fanCharts,
      expertCharts,
      streamingCharts,
      isLoading,
      currentTrack,
      setCurrentTrack,
      selectedGenres,
      setSelectedGenres,
      filteredFanCharts,
      filteredExpertCharts,
      filteredStreamingCharts,
      overallChart,
      activePromotion,
      hasVoted,
      setHasVoted,
      handleTrackClick,
      handleToggleGenre,
      handleClearFilters,
      getAllChartPositions,
      handleNavigateToChart,
    }),
    [
      fanCharts,
      expertCharts,
      streamingCharts,
      isLoading,
      currentTrack,
      setCurrentTrack,
      selectedGenres,
      setSelectedGenres,
      filteredFanCharts,
      filteredExpertCharts,
      filteredStreamingCharts,
      overallChart,
      activePromotion,
      hasVoted,
      handleTrackClick,
      handleToggleGenre,
      handleClearFilters,
      getAllChartPositions,
      handleNavigateToChart,
    ]
  );

  return (
    <ChartShellContext.Provider value={value}>
      <DataSourceBanner />
      {activePromotion && shouldShowSpotlight(pathname) && (
        <PromotionalSlot
          type={activePromotion.type}
          name={activePromotion.name}
          imageUrl={activePromotion.imageUrl}
        />
      )}
      {children}
      <ErrorBoundary level="component">
        <MusicPlayer
          currentTrack={currentTrack}
          onNext={handleNext}
          onPrevious={handlePrevious}
          allTracks={[...(fanCharts || []), ...(expertCharts || []), ...(streamingCharts || [])]}
        />
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <TrackDetailModal
          track={selectedTrackForModal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          allChartPositions={
            selectedTrackForModal ? getAllChartPositions(selectedTrackForModal) : []
          }
          onNavigateToChart={handleNavigateToChart}
        />
      </ErrorBoundary>
    </ChartShellContext.Provider>
  );
}