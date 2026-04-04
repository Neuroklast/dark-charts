import { Track } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumArtwork } from './AlbumArtwork';
import { Badge } from '@/components/ui/badge';
import { CaretUp, CaretDown, TrendUp } from '@phosphor-icons/react';

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
        <div className="relative z-10 space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 border border-border bg-card/50">
              <Skeleton className="w-8 h-8 bg-muted shrink-0" />
              <Skeleton className="w-20 h-20 bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-16 bg-muted" />
                  <Skeleton className="h-4 w-12 bg-muted" />
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
      <div className="relative z-10 space-y-2 p-4">
        {topThree.map((track, index) => {
          const movementColor = track.movement && track.movement > 0 ? 'text-accent' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
          const glowColor = track.rank === 1 ? 'primary' : track.rank <= 3 ? 'accent' : 'primary';
          
          return (
            <div
              key={track.id}
              className="cyber-card flex items-center gap-3 p-3 cursor-pointer group hover:border-primary/50 transition-all"
              onClick={() => onTrackClick?.(track)}
            >
              <div className="cyber-scanline opacity-50" />
              
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 instant-transition" />
              
              <div className="flex items-center gap-2 min-w-[60px] relative z-10">
                <div className={`display-font text-3xl leading-none font-semibold snap-transition ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}>
                  {String(track.rank).padStart(2, '0')}
                </div>
                
                {track.movement !== undefined && track.movement !== 0 && (
                  <div className={`flex flex-col items-center ${movementColor}`}>
                    {track.movement > 0 ? (
                      <CaretUp weight="fill" className="w-4 h-4" />
                    ) : (
                      <CaretDown weight="fill" className="w-4 h-4" />
                    )}
                    <span className="text-[8px] font-bold">{Math.abs(track.movement)}</span>
                  </div>
                )}
              </div>

              <AlbumArtwork
                src={track.albumArt}
                alt={`${track.artist} - ${track.title}`}
                artist={track.artist}
                title={track.title}
                size="medium"
                glowColor={glowColor}
              />

              <div className="flex-1 min-w-0 relative z-10">
                <div className="cyber-hover-chromatic data-font text-base font-bold text-foreground truncate">
                  {track.title}
                </div>
                <div className="data-font text-xs text-muted-foreground truncate mt-0.5">
                  {track.artist}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {track.genres.slice(0, 2).map((genre, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="uppercase text-[8px] font-ui font-semibold tracking-[0.1em] border border-border text-foreground/70 hover:bg-primary/20 hover:border-primary/50 snap-transition px-1.5 py-0.5"
                    >
                      {genre}
                    </Badge>
                  ))}
                  {track.genres.length > 2 && (
                    <Badge variant="outline" className="uppercase text-[8px] font-ui font-semibold border border-border px-1.5 py-0.5">
                      +{track.genres.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                  <TrendUp className="w-3 h-3 text-muted-foreground" />
                  <span className="data-font text-[9px] text-muted-foreground uppercase">W</span>
                  <span className="data-font text-sm font-bold text-foreground">{track.weeksInChart || 1}</span>
                </div>
                
                <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                  <span className="data-font text-[9px] text-muted-foreground uppercase">Votes</span>
                  <span className="data-font text-sm font-bold text-accent">{track.votes || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
