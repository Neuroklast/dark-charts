import { MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';
import { buildItunesChartEntries } from '@/lib/charts/itunesChartStore';
import { ensureItunesChartsBootstrapped } from '@/lib/sync/itunesSyncProcessor';

export async function getItunesChartResponse(params: {
  type: 'fan' | 'expert' | 'streaming' | 'combined';
  limit: number;
  genre?: string;
  mainGenre?: string;
}): Promise<{
  success: true;
  chartType: string;
  entries: ReturnType<typeof buildItunesChartEntries>;
  count: number;
  source: 'itunes';
}> {
  await ensureItunesChartsBootstrapped();

  let genreFilter: string | undefined;
  let mainGenreFilter: MainGenre | undefined;

  if (params.genre) {
    genreFilter = params.genre;
  } else if (params.mainGenre && params.mainGenre in mainGenreMap) {
    mainGenreFilter = params.mainGenre as MainGenre;
  }

  const chartType = params.type === 'streaming' ? 'fan' : params.type;
  const entries = buildItunesChartEntries(chartType, {
    limit: params.limit,
    genre: genreFilter,
    mainGenre: mainGenreFilter,
  });

  return {
    success: true,
    chartType: params.type,
    entries,
    count: entries.length,
    source: 'itunes',
  };
}