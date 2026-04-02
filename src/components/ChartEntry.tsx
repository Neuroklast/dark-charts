import { Track } from '@/types';
import { CaretUp, CaretDown, Crown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ChartEntryProps {
  track: Track;
  index: number;
}

export function ChartEntry({ track, index }: ChartEntryProps) {
  const movementColor = track.movement && track.movement > 0 ? 'text-primary' : track.movement && track.movement < 0 ? 'text-muted-foreground' : 'text-muted-foreground';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: 'linear' }}
      className="flex items-center gap-6 p-6 border-b border-border hover:border-accent transition-colors duration-100 group cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-[120px]">
        <div className="relative">
          <div className={`display-font text-5xl leading-none ${track.rank === 1 ? 'text-primary' : 'text-foreground'}`}>
            {track.rank}
          </div>
          {track.rank === 1 && (
            <Crown weight="fill" className="absolute -top-3 -right-3 w-6 h-6 text-primary" />
          )}
        </div>
        
        {track.movement !== undefined && track.movement !== 0 && (
          <div className={`flex items-center gap-1 ${movementColor}`}>
            {track.movement > 0 ? (
              <CaretUp weight="bold" className="w-5 h-5" />
            ) : (
              <CaretDown weight="bold" className="w-5 h-5" />
            )}
            <span className="data-font text-sm font-bold">{Math.abs(track.movement)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="data-font text-lg font-medium text-foreground truncate">
          {track.artist}
        </div>
        <div className="data-font text-base text-card-foreground truncate mt-1">
          {track.title}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {track.genres.slice(0, 3).map((genre, idx) => (
            <Badge 
              key={idx} 
              variant="outline"
              className="uppercase text-xs font-ui font-medium tracking-wider border-secondary text-secondary-foreground hover:border-accent hover:text-accent transition-colors duration-100"
            >
              {genre}
            </Badge>
          ))}
          {track.genres.length > 3 && (
            <Badge variant="outline" className="uppercase text-xs font-ui font-medium">
              +{track.genres.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
