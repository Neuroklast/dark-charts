import { ChartType, Genre, MainGenre, ViewType } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';

export const ROUTES = {
  home: '/',
  voting: '/voting',
  votingConfirmation: '/voting/confirmation',
  history: '/history',
  archive: '/charts/archive',
  profile: '/profile',
  customCharts: '/custom-charts',
  about: '/about',
  oauthCallback: '/oauth/callback',
  privacy: '/privacy',
  terms: '/terms',
  imprint: '/imprint',
  methodology: '/methodology',
  admin: '/admin',
  adminMetrics: '/admin/metrics',
  adminUsers: '/admin/users',
  adminArtists: '/admin/artists',
  adminCharts: '/admin/charts',
  adminPromotions: '/admin/promotions',
  adminSettings: '/admin/settings',
  adminAnomalies: '/admin/anomalies',
} as const;

const MAIN_GENRE_SLUGS: Record<MainGenre, string> = {
  Gothic: 'gothic',
  Metal: 'metal',
  'Dark Electro': 'dark-electro',
  Crossover: 'crossover',
};

const SLUG_TO_MAIN_GENRE = Object.fromEntries(
  Object.entries(MAIN_GENRE_SLUGS).map(([genre, slug]) => [slug, genre as MainGenre])
) as Record<string, MainGenre>;

const PILLAR_SLUGS: ChartType[] = ['fan', 'expert', 'streaming'];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mainGenreToSlug(genre: MainGenre): string {
  return MAIN_GENRE_SLUGS[genre];
}

export function slugToMainGenre(slug: string): MainGenre | null {
  return SLUG_TO_MAIN_GENRE[slug] ?? null;
}

export function subGenreToSlug(genre: Genre): string {
  return slugify(genre);
}

export function slugToSubGenre(slug: string, mainGenre?: MainGenre): Genre | null {
  if (!mainGenre) return null;
  const subGenres = mainGenreMap[mainGenre] ?? [];
  return subGenres.find((g) => subGenreToSlug(g) === slug) ?? null;
}

export function pillarChartPath(pillar: ChartType): string {
  return `/charts/${pillar}`;
}

export type PillarSlug = 'fan' | 'expert' | 'streaming';

export function isValidPillarSlug(slug: string): slug is PillarSlug {
  return PILLAR_SLUGS.includes(slug as ChartType);
}

export function mainGenrePath(mainGenre: MainGenre, subGenre?: Genre): string {
  const base = `/genre/${mainGenreToSlug(mainGenre)}`;
  return subGenre ? `${base}/${subGenreToSlug(subGenre)}` : base;
}

export function viewToPath(view: ViewType): string {
  switch (view) {
    case 'home':
      return ROUTES.home;
    case 'voting':
      return ROUTES.voting;
    case 'voting-confirmation':
      return ROUTES.votingConfirmation;
    case 'history':
      return ROUTES.history;
    case 'archive':
      return ROUTES.archive;
    case 'profile':
      return ROUTES.profile;
    case 'custom-charts':
      return ROUTES.customCharts;
    case 'about':
      return ROUTES.about;
    case 'oauth-callback':
      return ROUTES.oauthCallback;
    case 'privacy':
      return ROUTES.privacy;
    case 'terms':
      return ROUTES.terms;
    case 'imprint':
      return ROUTES.imprint;
    case 'admin':
      return ROUTES.admin;
    case 'admin-metrics':
      return ROUTES.adminMetrics;
    case 'admin-users':
      return ROUTES.adminUsers;
    case 'admin-artists':
      return ROUTES.adminArtists;
    case 'admin-charts':
      return ROUTES.adminCharts;
    case 'admin-promotions':
      return ROUTES.adminPromotions;
    case 'admin-settings':
      return ROUTES.adminSettings;
    case 'admin-anomalies':
      return ROUTES.adminAnomalies;
    default:
      return ROUTES.home;
  }
}

export function pathToView(pathname: string): ViewType | null {
  const path = pathname.replace(/\/$/, '') || '/';

  const exact: Record<string, ViewType> = {
    '/': 'home',
    [ROUTES.voting]: 'voting',
    [ROUTES.votingConfirmation]: 'voting-confirmation',
    [ROUTES.history]: 'history',
    [ROUTES.archive]: 'archive',
    [ROUTES.profile]: 'profile',
    [ROUTES.customCharts]: 'custom-charts',
    [ROUTES.about]: 'about',
    [ROUTES.oauthCallback]: 'oauth-callback',
    [ROUTES.privacy]: 'privacy',
    [ROUTES.terms]: 'terms',
    [ROUTES.imprint]: 'imprint',
    [ROUTES.admin]: 'admin',
    [ROUTES.adminMetrics]: 'admin-metrics',
    [ROUTES.adminUsers]: 'admin-users',
    [ROUTES.adminArtists]: 'admin-artists',
    [ROUTES.adminCharts]: 'admin-charts',
    [ROUTES.adminPromotions]: 'admin-promotions',
    [ROUTES.adminSettings]: 'admin-settings',
    [ROUTES.adminAnomalies]: 'admin-anomalies',
  };

  if (exact[path]) return exact[path];
  if (path.startsWith('/charts/')) return 'home';
  if (path.startsWith('/genre/')) return 'main-genre';
  return null;
}

export function navigateToChart(
  router: { push: (href: string) => void },
  chartType?: ChartType,
  mainGenre?: MainGenre,
  subGenre?: Genre
): void {
  if (mainGenre) {
    router.push(mainGenrePath(mainGenre, subGenre));
    return;
  }
  if (chartType && chartType !== 'overall') {
    router.push(pillarChartPath(chartType));
    return;
  }
  router.push(ROUTES.home);
}

export const NAV_ITEMS: { view: ViewType; href: string; labelKey: string; fallback: string }[] = [
  { view: 'home', href: ROUTES.home, labelKey: 'nav.home', fallback: 'Charts' },
  { view: 'custom-charts', href: ROUTES.customCharts, labelKey: 'nav.custom', fallback: 'Custom' },
  { view: 'voting', href: ROUTES.voting, labelKey: 'nav.voting', fallback: 'Vote' },
  { view: 'history', href: ROUTES.history, labelKey: 'nav.history', fallback: 'History' },
  { view: 'about', href: ROUTES.about, labelKey: 'nav.about', fallback: 'About' },
];

export const ADMIN_NAV_ITEMS = [
  { id: 'admin-metrics', href: ROUTES.adminMetrics, label: 'Dashboard' },
  { id: 'admin-users', href: ROUTES.adminUsers, label: 'Users' },
  { id: 'admin-artists', href: ROUTES.adminArtists, label: 'Artists & Blacklist' },
  { id: 'admin-charts', href: ROUTES.adminCharts, label: 'Charts Control' },
  { id: 'admin-promotions', href: ROUTES.adminPromotions, label: 'Promotions' },
  { id: 'admin-settings', href: ROUTES.adminSettings, label: 'Settings' },
] as const;