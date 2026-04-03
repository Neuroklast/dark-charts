import { Track } from '@/types';
import { ChartEntry } from './ChartEntry';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCategoryProps {
  title: string;
  tracks: Track[];
  isLoading?: boolean;
  onTrackClick?: (track: Track) => void;
}

export function ChartCategory({ title, tracks, isLoading, onTrackClick }: ChartCategoryProps) {
  const topThree = tracks.slice(0, 3);

  if (isLoading) {
    return (
      <div className="cyber-card relative">
        <div className="cyber-scanline" />
        <div className="p-4 border-b border-border relative z-10">
          <h2 className="cyber-hover-chromatic display-font text-xl uppercase text-foreground tracking-tight font-semibold">{title}</h2>
        </div>
        <div className="relative z-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 bg-muted" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-16 bg-muted" />
                    <Skeleton className="h-4 w-12 bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card overflow-hidden relative">
      <div className="cyber-scanline" />
      <div className="p-4 border-b border-border relative z-10">
        <h2 className="cyber-hover-chromatic display-font text-xl uppercase text-foreground tracking-tight font-semibold">{title}</h2>
      </div>
      <div className="relative z-10">
        {topThree.map((track, index) => (
          <ChartEntry key={track.id} track={track} index={index} onClick={onTrackClick} />
        ))}
      </div>
    </div>
  );
}
