'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isValidPillarSlug } from '@/lib/routes';
import { PillarChartList } from '../../_components/HomeChartsView';

interface PillarPageProps {
  params: Promise<{ pillar: string }>;
}

export default function PillarChartPage({ params }: PillarPageProps) {
  const { pillar } = use(params);

  if (!isValidPillarSlug(pillar)) {
    notFound();
  }

  return (
    <main id="main-content" className="w-full px-4 md:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <ErrorBoundary level="component">
          <PillarChartList pillar={pillar} />
        </ErrorBoundary>
      </div>
    </main>
  );
}