'use client';

import { useEffect, useState } from 'react';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { HybridChartTable } from '@/components/HybridChartTable';
import { ChartSidebar } from '@/components/ChartSidebar';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useChartShell } from './ChartShellClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatHybridWeightsPercent } from '@/lib/math/normalization';
import { DEFAULT_CHART_WEIGHTS } from '@/lib/api/systemSettings';
import type { ChartWeights } from '@/types';

export function HomeChartsView() {
  const { overallChart, isLoading, handleTrackClick, hasVoted } = useChartShell();
  const { t } = useLanguage();
  const [weights, setWeights] = useState<ChartWeights>(DEFAULT_CHART_WEIGHTS);

  useEffect(() => {
    fetch('/api/charts/weights')
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const pct = formatHybridWeightsPercent(weights);
  const weightsLabel = t('chart.weightsFormula')
    .replace('{fan}', String(pct.fan))
    .replace('{expert}', String(pct.expert));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <HybridChartTable
        tracks={overallChart}
        isLoading={isLoading}
        onTrackClick={handleTrackClick}
        weightsLabel={weightsLabel}
      />
      <ChartSidebar hasVoted={hasVoted} />
    </div>
  );
}

interface PillarChartListProps {
  pillar: 'fan' | 'club';
}

const PILLAR_CONFIG = {
  fan: { title: 'Fan Charts', tracksKey: 'filteredFanCharts' as const },
  club: { title: 'Club Charts', tracksKey: 'filteredExpertCharts' as const },
};

export function PillarChartList({ pillar }: PillarChartListProps) {
  const shell = useChartShell();
  const config = PILLAR_CONFIG[pillar];
  const tracks = shell[config.tracksKey];
  const { isLoading, handleTrackClick } = shell;

  return (
    <div className="space-y-6">
      <ErrorBoundary level="component">
        <Card className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {config.title}
            </h2>
          </div>
          {isLoading ? (
            <div>
              {Array.from({ length: 20 }).map((_, index) => (
                <ChartEntrySkeleton key={index} index={index} />
              ))}
            </div>
          ) : (
            <motion.div layout>
              <AnimatePresence mode="popLayout">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track?.id || `track-${index}`}
                    layoutId={`track-${track?.id || index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ChartEntry
                      track={track}
                      index={index}
                      onClick={handleTrackClick}
                      animate
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </Card>
      </ErrorBoundary>
    </div>
  );
}