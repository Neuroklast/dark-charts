import { Track } from '@/types';
import { Skull } from '@phosphor-icons/react';

interface ChartPosition {
  chartName: string;
  position: number;
}

interface TrackShareCardProps {
  track: Track;
  artworkUrl: string;
  chartPositions: ChartPosition[];
}

export function TrackShareCard({ track, artworkUrl, chartPositions }: TrackShareCardProps) {
  return (
    <div 
      className="w-[1200px] h-[630px] bg-background p-12 flex flex-col"
      style={{
        background: 'linear-gradient(135deg, oklch(0.12 0 0) 0%, oklch(0.10 0 0) 100%)',
      }}
    >
      <div className="flex items-start gap-8 mb-8">
        <div className="flex items-center gap-4">
          <Skull size={48} weight="fill" className="text-primary" />
          <div>
            <div className="font-display text-3xl uppercase tracking-tight text-foreground">
              Dark Charts
            </div>
            <div className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Independent Music Charts
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 flex-1">
        <div className="w-[400px] h-[400px] bg-muted flex-shrink-0">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={`${track.title} by ${track.artist}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Skull size={120} className="text-muted-foreground/30" weight="fill" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-ui uppercase tracking-[0.2em] text-accent mb-3">
                Now Charting
              </div>
              <h2 className="text-6xl font-display uppercase tracking-tight text-foreground mb-3 leading-tight line-clamp-2">
                {track.title}
              </h2>
              <div className="text-3xl text-muted-foreground font-ui line-clamp-1">
                {track.artist}
              </div>
            </div>

            {track.album && (
              <div>
                <div className="text-xs font-ui uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Album
                </div>
                <div className="text-xl text-foreground font-ui line-clamp-1">
                  {track.album}
                </div>
              </div>
            )}
          </div>

          {chartPositions.length > 0 && (
            <div>
              <div className="text-xs font-ui uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Chart Positions
              </div>
              <div className="grid grid-cols-2 gap-3">
                {chartPositions.slice(0, 6).map((position, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-secondary/30 border border-border"
                  >
                    <span className="font-ui text-sm uppercase tracking-wider text-foreground">
                      {position.chartName}
                    </span>
                    <span className="font-display text-2xl text-primary data-font">
                      #{position.position}
                    </span>
                  </div>
                ))}
              </div>
              {chartPositions.length > 6 && (
                <div className="mt-3 text-xs font-ui text-muted-foreground uppercase tracking-wider">
                  + {chartPositions.length - 6} more positions
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
        <div className="font-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Dark Charts &copy; {new Date().getFullYear()}
        </div>
        <div className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Independent • Community-Driven • Transparent
        </div>
      </div>
    </div>
  );
}
