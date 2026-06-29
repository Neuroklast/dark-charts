import { Genre, MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';
import { rankToPoints, calculateConsensusBonus, calculateTotalScore } from '@/lib/math/borda';
import { ChartWeights } from '@/types';

export interface ItunesSyncedRelease {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: string;
  artworkUrl: string | null;
  collectionViewUrl: string;
  itunesId: string;
  genres: Genre[];
  mainGenre: MainGenre;
  releaseType: 'single' | 'ep' | 'album';
  label: string | null;
  syncedAt: number;
}

export interface ItunesChartEntry {
  id: string;
  placement: number;
  score: number;
  communityPower: number | null;
  movement: number | null;
  chartType: string;
  weekStart: string;
  createdAt: string;
  release: {
    id: string;
    title: string;
    releaseType: string | null;
    releaseDate: string;
    spotifyId: string | null;
    odesliLinks: unknown;
    itunesArtworkUrl: string | null;
    vercelBlobUrl: string | null;
    artist: {
      id: string;
      name: string;
      spotifyId: string | null;
      genres: string[] | null;
      bio: string | null;
      profileLink: string | null;
      imageUrl: string | null;
    } | null;
  } | null;
}

type GlobalStore = typeof globalThis & {
  __darkChartsItunesReleases?: Map<string, ItunesSyncedRelease>;
};

const HYBRID_WEIGHTS: ChartWeights = { fan: 55, expert: 45, streaming: 0 };

function getReleaseStore(): Map<string, ItunesSyncedRelease> {
  const g = globalThis as GlobalStore;
  if (!g.__darkChartsItunesReleases) {
    g.__darkChartsItunesReleases = new Map();
  }
  return g.__darkChartsItunesReleases;
}

export function upsertItunesReleases(releases: ItunesSyncedRelease[]): void {
  const store = getReleaseStore();
  for (const release of releases) {
    store.set(release.id, release);
  }
}

export function getItunesReleaseCount(): number {
  return getReleaseStore().size;
}

export function getAllItunesReleases(): ItunesSyncedRelease[] {
  return Array.from(getReleaseStore().values());
}

function releaseMatchesGenreFilter(
  release: ItunesSyncedRelease,
  genre?: string,
  mainGenre?: MainGenre
): boolean {
  if (genre) {
    return release.genres.includes(genre as Genre);
  }
  if (mainGenre) {
    const allowed = new Set(mainGenreMap[mainGenre]);
    return release.genres.some((g) => allowed.has(g));
  }
  return true;
}

function recencyScore(releaseDate: string): number {
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, 365 - ageDays);
}

function clubScore(release: ItunesSyncedRelease): number {
  const typeBonus = release.releaseType === 'album' ? 30 : release.releaseType === 'ep' ? 20 : 10;
  return recencyScore(release.releaseDate) + typeBonus;
}

function toChartEntry(
  release: ItunesSyncedRelease,
  placement: number,
  chartType: string,
  score: number
): ItunesChartEntry {
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 1);

  return {
    id: `${chartType}-${release.id}`,
    placement,
    score,
    communityPower: Math.round(recencyScore(release.releaseDate)),
    movement: 0,
    chartType,
    weekStart: weekStart.toISOString(),
    createdAt: new Date().toISOString(),
    release: {
      id: release.id,
      title: release.title,
      releaseType: release.releaseType,
      releaseDate: release.releaseDate,
      spotifyId: null,
      odesliLinks: null,
      itunesArtworkUrl: release.artworkUrl,
      vercelBlobUrl: null,
      artist: {
        id: release.artistId,
        name: release.artistName,
        spotifyId: null,
        genres: release.genres,
        bio: null,
        profileLink: release.collectionViewUrl,
        imageUrl: release.artworkUrl,
      },
    },
  };
}

function buildFanRanking(releases: ItunesSyncedRelease[]): ItunesSyncedRelease[] {
  return [...releases].sort((a, b) => {
    const dateDiff = new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.artistName.localeCompare(b.artistName);
  });
}

function buildClubRanking(releases: ItunesSyncedRelease[]): ItunesSyncedRelease[] {
  return [...releases].sort((a, b) => {
    const scoreDiff = clubScore(b) - clubScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.artistName.localeCompare(b.artistName);
  });
}

function buildCombinedRanking(
  fanRanked: ItunesSyncedRelease[],
  clubRanked: ItunesSyncedRelease[]
): ItunesSyncedRelease[] {
  const fanRankMap = new Map(fanRanked.map((r, i) => [r.id, i + 1]));
  const clubRankMap = new Map(clubRanked.map((r, i) => [r.id, i + 1]));
  const allIds = new Set([...fanRankMap.keys(), ...clubRankMap.keys()]);
  const total = Math.max(fanRanked.length, clubRanked.length, 1);

  const scored = Array.from(allIds).map((id) => {
    const fanRank = fanRankMap.get(id);
    const clubRank = clubRankMap.get(id);
    const poolsPresent = [fanRank, clubRank].filter((r) => r !== undefined).length;
    const bonus = calculateConsensusBonus(poolsPresent);
    const fanPoints = fanRank ? rankToPoints(fanRank, total) : 0;
    const clubPoints = clubRank ? rankToPoints(clubRank, total) : 0;
    const score =
      calculateTotalScore(fanPoints, clubPoints, 0, HYBRID_WEIGHTS) * bonus;
    const release = fanRanked.find((r) => r.id === id) ?? clubRanked.find((r) => r.id === id)!;
    return { release, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.release);
}

export function buildItunesChartEntries(
  chartType: 'fan' | 'expert' | 'streaming' | 'combined',
  options: {
    limit?: number;
    genre?: string;
    mainGenre?: MainGenre;
  } = {}
): ItunesChartEntry[] {
  const limit = options.limit ?? 20;
  const pool = getAllItunesReleases().filter((release) =>
    releaseMatchesGenreFilter(release, options.genre, options.mainGenre)
  );

  if (pool.length === 0) return [];

  const fanRanked = buildFanRanking(pool);
  const clubRanked = buildClubRanking(pool);

  let ranked: ItunesSyncedRelease[];
  let typeKey: string;

  switch (chartType) {
    case 'fan':
      ranked = fanRanked;
      typeKey = 'fan';
      break;
    case 'expert':
      ranked = clubRanked;
      typeKey = 'expert';
      break;
    case 'combined':
      ranked = buildCombinedRanking(fanRanked, clubRanked);
      typeKey = 'combined';
      break;
    default:
      ranked = fanRanked;
      typeKey = 'fan';
  }

  return ranked.slice(0, limit).map((release, index) => {
    const placement = index + 1;
    const score =
      chartType === 'expert'
        ? clubScore(release)
        : chartType === 'combined'
          ? recencyScore(release.releaseDate)
          : recencyScore(release.releaseDate);
    return toChartEntry(release, placement, typeKey, score);
  });
}