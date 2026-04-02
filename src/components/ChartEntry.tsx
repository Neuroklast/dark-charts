import { Track } from '@/types';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { AlbumArtwork } from './AlbumArtwork';

interface ChartEntryProps {
  track: Track;
  index: number;
}

export function ChartEntry({ track, index }: ChartEntryProps) {
  const movementColor = track.movement && track.movement > 0 ? 'text-accent' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
  const glowColor = track.rank === 1 ? 'primary' : track.rank <= 3 ? 'accent' : 'primary';
  
  return (
    <div
      className="flex items-center gap-4 p-4 border-b border-border hover:bg-card/50 snap-transition group relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 snap-transition" />
      
      <div className="flex items-center gap-3 min-w-[100px]">
        <div className="relative">
          <div className={`display-font text-4xl leading-none font-semibold snap-transition ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}>
            {String(track.rank).padStart(2, '0')}
          </div>
        </div>
        
        {track.movement !== undefined && track.movement !== 0 && (
          <div className={`flex flex-col items-center ${movementColor}`}>
            {track.movement > 0 ? (
              <CaretUp weight="fill" className="w-5 h-5" />
            ) : (
              <CaretDown weight="fill" className="w-5 h-5" />
            )}
            <span className="data-font text-[10px] font-bold">{Math.abs(track.movement)}</span>
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

      <div className="flex-1 min-w-0">
        <div className="data-font text-base font-bold text-foreground truncate group-hover:text-primary snap-transition">
          {track.artist}
        </div>
        <div className="data-font text-xs text-muted-foreground truncate mt-0.5">
          {track.title}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {track.genres.slice(0, 3).map((genre, idx) => (
            <Badge 
              key={idx} 
              variant="outline"
              className="uppercase text-[8px] font-ui font-semibold tracking-[0.1em] border border-border text-foreground/70 hover:bg-primary/20 hover:border-primary/50 snap-transition px-1.5 py-0.5"
            >
              {genre}
            </Badge>
          ))}
          {track.genres.length > 3 && (
            <Badge variant="outline" className="uppercase text-[8px] font-ui font-semibold border border-border px-1.5 py-0.5">
              +{track.genres.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
