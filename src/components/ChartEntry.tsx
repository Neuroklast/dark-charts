import { Track } from '@/types';
import { CaretUp, CaretDown, TrendUp, TrendDown, ArrowUp, ArrowDown, Minus, PlusCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { AlbumArtwork } from './AlbumArtwork';
import { SpotifyEmbed } from './SpotifyEmbed';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ChartEntryProps {
  track: Track;
  index: number;
  onClick?: (track: Track) => void;
  animate?: boolean;
}

export function ChartEntry({ track, index, onClick, animate = false }: ChartEntryProps) {
  const movementColor = track.movement && track.movement > 0 ? 'text-accent' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
  const glowColor = track.rank === 1 ? 'primary' : track.rank <= 3 ? 'accent' : 'primary';
  const communityPower = track.community_power ?? 0;
  const trendDirection = track.trend_direction;

  const getTrendIcon = () => {
    if (!trendDirection || trendDirection === 'stable') return <Minus className="w-4 h-4" />;
    if (trendDirection === 'new') return <PlusCircle weight="fill" className="w-4 h-4 text-accent" />;
    if (trendDirection === 'up') return <ArrowUp weight="bold" className="w-4 h-4 text-accent" />;
    return <ArrowDown weight="bold" className="w-4 h-4 text-primary" />;
  };
  
  return (
    <li
      className="cyber-card flex flex-col gap-3 p-4 border-b group overflow-hidden cursor-pointer"
      onClick={() => onClick?.(track)}
      role="button"
      tabIndex={0}
      aria-label={`${track.title} by ${track.artist}, rank ${track.rank}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(track);
        }
      }}
    >
      <div className="cyber-scanline" />
      
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 instant-transition" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 min-w-[100px]">
          <div className="relative flex items-center gap-2">
            {trendDirection && (
              <div className={`${trendDirection === 'up' ? 'text-accent' : trendDirection === 'down' ? 'text-primary' : trendDirection === 'new' ? 'text-accent' : 'text-muted-foreground'}`} aria-label={`Trend: ${trendDirection}`}>
                {getTrendIcon()}
              </div>
            )}
            {animate ? (
              <motion.div 
                key={`rank-${track.id}-${track.rank}`}
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`display-font text-4xl leading-none font-semibold ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}
              >
                {String(track.rank).padStart(2, '0')}
              </motion.div>
            ) : (
              <div className={`display-font text-4xl leading-none font-semibold snap-transition ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}>
                {String(track.rank).padStart(2, '0')}
              </div>
            )}
          </div>
          
          {track.movement !== undefined && track.movement !== 0 && (
            <div className={`flex flex-col items-center ${movementColor}`}>
              {track.movement > 0 ? (
                <CaretUp weight="fill" className="w-5 h-5" />
              ) : (
                <CaretDown weight="fill" className="w-5 h-5" />
              )}
              <span className="cyber-data-label">{Math.abs(track.movement)}</span>
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
          <div className="cyber-hover-chromatic data-font text-xl font-bold text-foreground truncate">
            {track.title}
          </div>
          <div className="data-font text-base text-muted-foreground truncate mt-1">
            {track.artist}
          </div>
          {communityPower > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-ui text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Community Power</span>
                <span className="data-font text-xs font-bold text-accent">{communityPower}%</span>
              </div>
              <Progress value={communityPower} className="h-1.5 bg-secondary" aria-label={`Community power: ${communityPower}%`} />
            </div>
          )}
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

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <TrendUp className="w-4 h-4 text-muted-foreground" />
            <span className="data-font text-xs text-muted-foreground">Wochen</span>
            <span className="data-font text-base font-bold text-foreground">{track.weeksInChart || 1}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <span className="data-font text-xs text-muted-foreground">Votes</span>
            <span className="data-font text-base font-bold text-accent">{track.votes || 0}</span>
          </div>
        </div>
      </div>

      <div className="pl-28">
        <SpotifyEmbed 
          spotifyUri={track.spotifyUri} 
          artist={track.artist}
          title={track.title}
        />
      </div>
    </li>
  );
}
