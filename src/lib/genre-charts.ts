import { Genre, MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';

export const MIN_GENRE_FAN_VOTES = 5;
export const GENRE_CHART_LIMIT = 10;
export const MAIN_GENRE_PREFIX = 'main:';

export function mainGenreChartKey(mainGenre: MainGenre): string {
  return `${MAIN_GENRE_PREFIX}${mainGenre}`;
}

export function isMainGenreChartKey(value: string): boolean {
  return value.startsWith(MAIN_GENRE_PREFIX);
}

export function parseMainGenreChartKey(value: string): MainGenre | null {
  if (!isMainGenreChartKey(value)) return null;
  const name = value.slice(MAIN_GENRE_PREFIX.length) as MainGenre;
  return name in mainGenreMap ? name : null;
}

export function getAllSubGenres(): Genre[] {
  return Object.values(mainGenreMap).flat();
}

export function releaseMatchesGenre(
  releaseGenres: string[] | null | undefined,
  artistGenres: string[] | null | undefined,
  targetGenre: Genre
): boolean {
  const genres = releaseGenres?.length ? releaseGenres : artistGenres ?? [];
  return genres.includes(targetGenre);
}

export function releaseMatchesMainGenre(
  releaseGenres: string[] | null | undefined,
  artistGenres: string[] | null | undefined,
  mainGenre: MainGenre
): boolean {
  const allowed = new Set(mainGenreMap[mainGenre]);
  const genres = releaseGenres?.length ? releaseGenres : artistGenres ?? [];
  return genres.some((g) => allowed.has(g as Genre));
}