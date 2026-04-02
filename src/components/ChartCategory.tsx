import { Track } from '@/types';
import { ChartEntry } from './ChartEntry';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCategoryProps {
  title: string;
  tracks: Track[];
  isLoading?: boolean;
}

export function ChartCategory({ title, tracks, isLoading }: ChartCategoryProps) {
  const topThree = tracks.slice(0, 3);

  if (isLoading) {
    return (
      <Card className="bg-card border-4 border-border">
        <div className="p-6 border-b-4 border-border bg-secondary/20">
          <h2 className="display-font text-3xl uppercase text-foreground tracking-wider">{title}</h2>
        </div>
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border-b-2 border-border">
              <div className="flex items-center gap-6">
                <Skeleton className="w-20 h-20 bg-muted" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-muted" />
                  <Skeleton className="h-5 w-1/2 bg-muted" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 bg-muted" />
                    <Skeleton className="h-6 w-20 bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-2 border-border overflow-hidden hover:border-primary instant-transition">
      <div className="p-5 border-b-2 border-border bg-secondary">
        <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-bold">{title}</h2>
      </div>
      <div>
        {topThree.map((track, index) => (
          <ChartEntry key={track.id} track={track} index={index} />
        ))}
      </div>
    </Card>
  );
}
