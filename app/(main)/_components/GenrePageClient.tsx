'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChartType, Genre, MainGenre } from '@/types';
import { GenreCharts } from '@/components/GenreCharts';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { mainGenrePath } from '@/lib/routes';
import { useChartShell } from './ChartShellClient';

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
    fanCharts,
    expertCharts,
    streamingCharts,
    isLoading,
    handleTrackClick,
  } = useChartShell();

  const filteredCharts = useMemo(() => {
    if (!subGenre) {
      return { fanCharts, expertCharts, streamingCharts };
    }
    const filterBySub = (tracks: typeof fanCharts) =>
      tracks.filter((t) => t.genres?.includes(subGenre));

    return {
      fanCharts: filterBySub(fanCharts),
      expertCharts: filterBySub(expertCharts),
      streamingCharts: filterBySub(streamingCharts),
    };
  }, [subGenre, fanCharts, expertCharts, streamingCharts]);

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