'use client';

import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { PromotionalSlot } from '@/components/PromotionalSlot';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useChartShell } from './ChartShellClient';

export function HomeChartsView() {
  const {
    filteredFanCharts,
    filteredExpertCharts,
    filteredStreamingCharts,
    isLoading,
    activePromotion,
    hasVoted,
    handleTrackClick,
  } = useChartShell();

  return (
    <div className="space-y-6">
      {activePromotion && hasVoted && (
        <PromotionalSlot
          type={activePromotion.type}
          name={activePromotion.name}
          imageUrl={activePromotion.imageUrl}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ErrorBoundary level="component">
          <ChartCategory
            title="Fan Charts Top 3"
            tracks={filteredFanCharts || []}
            isLoading={isLoading}
            onTrackClick={handleTrackClick}
          />
        </ErrorBoundary>
        <ErrorBoundary level="component">
          <ChartCategory
            title="Expert Charts Top 3"
            tracks={filteredExpertCharts || []}
            isLoading={isLoading}
            onTrackClick={handleTrackClick}
          />
        </ErrorBoundary>
        <ErrorBoundary level="component">
          <ChartCategory
            title="Streaming Charts Top 3"
            tracks={filteredStreamingCharts || []}
            isLoading={isLoading}
            onTrackClick={handleTrackClick}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

interface PillarChartListProps {
  pillar: 'fan' | 'expert' | 'streaming';
}

const PILLAR_CONFIG = {
  fan: { title: 'Fan Charts', tracksKey: 'filteredFanCharts' as const },
  expert: { title: 'Expert Charts', tracksKey: 'filteredExpertCharts' as const },
  streaming: { title: 'Streaming Charts', tracksKey: 'filteredStreamingCharts' as const },
};

export function PillarChartList({ pillar }: PillarChartListProps) {
  const shell = useChartShell();
  const config = PILLAR_CONFIG[pillar];
  const tracks = shell[config.tracksKey];
  const { isLoading, handleTrackClick, activePromotion, hasVoted } = shell;

  return (
    <div className="space-y-6">
      {activePromotion && hasVoted && (
        <PromotionalSlot
          type={activePromotion.type}
          name={activePromotion.name}
          imageUrl={activePromotion.imageUrl}
        />
      )}
      <ErrorBoundary level="component">
        <Card className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {config.title}
            </h2>
          </div>
          {isLoading ? (
            <div>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
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
                    transition={{
                      layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.15 },
                    }}
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