import { Track } from '@/types';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';

interface ChartEntryProps {
  track: Track;
  index: number;
}

export function ChartEntry({ track, index }: ChartEntryProps) {
  const movementColor = track.movement && track.movement > 0 ? 'text-toxic' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
  
  return (
    <div
      className="flex items-center gap-6 p-6 border-b border-border hover:bg-card instant-transition group relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 instant-transition group-hover:glow-primary" />
      
      <div className="flex items-center gap-4 min-w-[140px]">
        <div className="relative">
          <div className={`display-font text-5xl leading-none font-bold instant-transition ${track.rank === 1 ? 'text-primary group-hover:glow-primary' : track.rank <= 3 ? 'text-accent group-hover:glow-accent' : 'text-foreground'}`}>
            {String(track.rank).padStart(2, '0')}
          </div>
        </div>
        
        {track.movement !== undefined && track.movement !== 0 && (
          <div className={`flex flex-col items-center ${movementColor}`}>
            {track.movement > 0 ? (
              <CaretUp weight="fill" className="w-6 h-6" />
            ) : (
              <CaretDown weight="fill" className="w-6 h-6" />
            )}
            <span className="data-font text-xs font-bold">{Math.abs(track.movement)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="data-font text-lg font-bold text-foreground truncate group-hover:text-primary instant-transition">
          {track.artist}
        </div>
        <div className="data-font text-sm text-muted-foreground truncate mt-1">
          {track.title}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {track.genres.slice(0, 3).map((genre, idx) => (
            <Badge 
              key={idx} 
              variant="outline"
              className="uppercase text-[9px] font-ui font-bold tracking-[0.1em] border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary instant-transition"
            >
              {genre}
            </Badge>
          ))}
          {track.genres.length > 3 && (
            <Badge variant="outline" className="uppercase text-[9px] font-ui font-bold border border-border">
              +{track.genres.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
