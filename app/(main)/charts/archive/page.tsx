'use client';

export const dynamic = 'force-dynamic';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartArchiveView } from '@/components/ChartArchiveView';
import { PromotionalSlot } from '@/components/PromotionalSlot';
import { useChartShell } from '../../_components/ChartShellClient';

export default function ChartArchivePage() {
  const { activePromotion, hasVoted } = useChartShell();

  return (
    <main id="main-content" className="space-y-8">
      {activePromotion && hasVoted && (
        <PromotionalSlot
          type={activePromotion.type}
          name={activePromotion.name}
          imageUrl={activePromotion.imageUrl}
        />
      )}
      <ErrorBoundary level="component">
        <ChartArchiveView />
      </ErrorBoundary>
    </main>
  );
}