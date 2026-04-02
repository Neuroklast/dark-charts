import { Track } from '@/types';
import { CaretUp, CaretDown, Crown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ChartEntryProps {
  track: Track;
  index: number;
}

export function ChartEntry({ track, index }: ChartEntryProps) {
  const movementColor = track.movement && track.movement > 0 ? 'text-toxic' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-6 p-6 border-b-2 border-border hover:bg-secondary/30 transition-all duration-150 group cursor-crosshair relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      
      <div className="flex items-center gap-4 min-w-[140px]">
        <div className="relative">
          <div className={`display-font text-6xl leading-none font-bold ${track.rank === 1 ? 'text-accent' : track.rank <= 3 ? 'text-toxic' : 'text-foreground'}`}>
            {String(track.rank).padStart(2, '0')}
          </div>
          {track.rank === 1 && (
            <Crown weight="fill" className="absolute -top-4 -right-4 w-8 h-8 text-accent animate-pulse" style={{ animationDuration: '2s' }} />
          )}
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
        <div className="data-font text-xl font-bold text-foreground truncate group-hover:text-accent transition-colors">
          {track.artist}
        </div>
        <div className="data-font text-sm text-muted-foreground truncate mt-1">
          {track.title}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {track.genres.slice(0, 3).map((genre, idx) => (
            <Badge 
              key={idx} 
              variant="outline"
              className="uppercase text-[10px] font-ui font-bold tracking-[0.15em] border-2 border-border text-foreground hover:border-accent hover:text-accent hover:bg-accent/10 transition-all duration-150 cursor-crosshair"
            >
              {genre}
            </Badge>
          ))}
          {track.genres.length > 3 && (
            <Badge variant="outline" className="uppercase text-[10px] font-ui font-bold border-2 border-border">
              +{track.genres.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
