'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChartType, Genre, MainGenre } from '@/types';
import { GenreCharts } from '@/components/GenreCharts';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { mainGenrePath } from '@/lib/routes';
import { useChartShell } from './ChartShellClient';
import { useGenreChartData } from '@/hooks/useGenreChartData';

interface GenrePageClientProps {
  mainGenre: MainGenre;
  subGenre?: Genre | null;
}

export function GenrePageClient({ mainGenre, subGenre = null }: GenrePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pillarParam = searchParams.get('pillar');
  const activePillar: ChartType | 'overview' =
    pillarParam === 'fan' || pillarParam === 'expert' || pillarParam === 'streaming'
      ? pillarParam
      : 'overview';

  const {
    fanCharts: shellFan,
    expertCharts: shellExpert,
    streamingCharts: shellStreaming,
    isLoading: shellLoading,
    handleTrackClick,
  } = useChartShell();

  const {
    fanCharts: genreFan,
    expertCharts: genreExpert,
    streamingCharts: genreStreaming,
    isLoading: genreLoading,
    hasServerData,
  } = useGenreChartData(mainGenre, subGenre);

  const filteredCharts = useMemo(() => {
    if (hasServerData) {
      return {
        fanCharts: genreFan,
        expertCharts: genreExpert,
        streamingCharts: genreStreaming,
      };
    }

    const filterBySub = (tracks: typeof shellFan) => {
      if (!subGenre) return tracks;
      return tracks.filter((t) => t.genres?.includes(subGenre));
    };

    return {
      fanCharts: filterBySub(shellFan),
      expertCharts: filterBySub(shellExpert),
      streamingCharts: filterBySub(shellStreaming),
    };
  }, [
    hasServerData,
    genreFan,
    genreExpert,
    genreStreaming,
    subGenre,
    shellFan,
    shellExpert,
    shellStreaming,
  ]);

  const isLoading = hasServerData ? genreLoading : shellLoading;

  return (
    <div className="space-y-6">
      <ErrorBoundary level="component">
        <SubGenreNavigation
          mainGenre={mainGenre}
          activeSubGenre={subGenre}
          onSubGenreChange={(genre) => {
            router.push(mainGenrePath(mainGenre, genre ?? undefined));
          }}
        />
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <GenreCharts
          mainGenre={mainGenre}
          activePillar={activePillar}
          fanCharts={filteredCharts.fanCharts}
          expertCharts={filteredCharts.expertCharts}
          streamingCharts={filteredCharts.streamingCharts}
          isLoading={isLoading}
          onTrackClick={handleTrackClick}
        />
      </ErrorBoundary>
    </div>
  );
}