'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChartType, MainGenre } from '@/types';
import { PillarNavigation } from '@/components/PillarNavigation';
import { MainGenreNavigation } from '@/components/MainGenreNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ROUTES,
  mainGenrePath,
  pillarChartPath,
  slugToMainGenre,
} from '@/lib/routes';

function getActivePillar(pathname: string): ChartType | 'overview' {
  const match = pathname.match(/^\/charts\/(fan|expert|streaming)$/);
  if (match) return match[1] as ChartType;
  return 'overview';
}

function getActiveMainGenre(pathname: string): MainGenre | 'overall' {
  const match = pathname.match(/^\/genre\/([^/]+)/);
  if (!match) return 'overall';
  return slugToMainGenre(match[1]) ?? 'overall';
}

export function ChartNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const showChartNav =
    pathname === ROUTES.home ||
    pathname.startsWith('/charts/') ||
    pathname.startsWith('/genre/');

  if (!showChartNav) return null;

  const activePillar = getActivePillar(pathname);
  const activeGenre = getActiveMainGenre(pathname);

  return (
    <>
      <ErrorBoundary level="component">
        <PillarNavigation
          activePillar={activePillar}
          linkMode
          onPillarChange={(pillar) => {
            if (pillar === 'overview') {
              router.push(ROUTES.home);
            } else {
              router.push(pillarChartPath(pillar));
            }
          }}
          getPillarHref={(pillar) =>
            pillar === 'overview' ? ROUTES.home : pillarChartPath(pillar)
          }
          className="mb-0"
        />
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <MainGenreNavigation
          activeGenre={activeGenre}
          linkMode
          onGenreChange={(genre) => {
            if (genre === 'overall') {
              router.push(ROUTES.home);
            } else {
              router.push(mainGenrePath(genre));
            }
          }}
          getGenreHref={(genre) =>
            genre === 'overall' ? ROUTES.home : mainGenrePath(genre)
          }
          className="mb-0"
        />
      </ErrorBoundary>
    </>
  );
}