import { motion, AnimatePresence } from 'framer-motion';
import { Track, MainGenre, Genre, ChartType } from '@/types';
import { X, Play, CaretUp, CaretDown, Info, TrendUp, ArrowRight } from '@phosphor-icons/react';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChartPosition {
  chartName: string;
  position: number;
  chartType?: ChartType;
  mainGenre?: MainGenre;
  subGenre?: Genre;
}

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (trackId: string, direction: 'up' | 'down') => void;
  userVote?: 'up' | 'down' | null;
  allChartPositions?: ChartPosition[];
  onNavigateToChart?: (chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => void;
}

export function TrackDetailModal({ track, isOpen, onClose, onVote, userVote, allChartPositions = [], onNavigateToChart }: TrackDetailModalProps) {
  if (!track) return null;

  const getSpotifyEmbedId = (uri?: string): string | null => {
    if (!uri) return null;
    const match = uri.match(/spotify:track:(.+)/);
    return match ? match[1] : null;
  };

  const spotifyId = getSpotifyEmbedId(track.spotifyUri);

  const handleChartClick = (position: ChartPosition) => {
    if (onNavigateToChart) {
      onNavigateToChart(position.chartType, position.mainGenre, position.subGenre);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none">
            <div className="min-h-screen px-4 flex items-center justify-center py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="cyber-card w-full max-w-4xl pointer-events-auto relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cyber-scanline" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 bg-background/80 border border-border hover:border-primary transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>

                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="aspect-square w-full bg-muted relative overflow-hidden group">
                        {track.albumArt ? (
                          <img
                            src={track.albumArt}
                            alt={`${track.title} by ${track.artist}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={64} className="text-muted-foreground" weight="fill" />
                          </div>
                        )}
                      </div>

                      {onVote && (
                        <div className="flex items-center gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onVote(track.id, 'up')}
                                  variant={userVote === 'up' ? 'default' : 'outline'}
                                  size="lg"
                                  className="flex-1 font-ui uppercase tracking-wider"
                                >
                                  <CaretUp size={20} weight="bold" className="mr-2" />
                                  Vote Up
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-ui text-xs">Increase this track's chart position</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onVote(track.id, 'down')}
                                  variant={userVote === 'down' ? 'destructive' : 'outline'}
                                  size="lg"
                                  className="flex-1 font-ui uppercase tracking-wider"
                                >
                                  <CaretDown size={20} weight="bold" className="mr-2" />
                                  Vote Down
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-ui text-xs">Decrease this track's chart position</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}

                      {track.votes !== undefined && (
                        <div className="p-4 bg-secondary/50 border border-border">
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Current Votes
                          </div>
                          <div className="text-3xl font-display text-primary data-font">
                            {track.votes.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                            Current Chart Position
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-ui text-xs">Position in the current chart view</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-6xl font-display text-primary mb-4 data-font">
                          #{track.rank}
                        </div>
                      </div>

                      {allChartPositions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                              All Chart Positions
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info size={14} className="text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-ui text-xs">Click to navigate to any chart where this track appears</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                            {allChartPositions.map((position, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleChartClick(position)}
                                className="flex items-center justify-between p-3 bg-secondary/30 border border-border hover:border-primary hover:bg-primary/10 transition-all group"
                              >
                                <span className="font-ui text-xs uppercase tracking-wider text-foreground text-left flex-1">
                                  {position.chartName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-lg text-primary data-font">
                                    #{position.position}
                                  </span>
                                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-foreground mb-2 leading-tight">
                          {track.title}
                        </h2>
                        <div className="text-xl text-muted-foreground font-ui">
                          {track.artist}
                        </div>
                      </div>

                      {track.album && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Album
                          </div>
                          <div className="text-base text-foreground font-ui">
                            {track.album}
                          </div>
                        </div>
                      )}

                      {track.releaseDate && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Release Date
                          </div>
                          <div className="text-base text-foreground font-ui data-font">
                            {track.releaseDate}
                          </div>
                        </div>
                      )}

                      {track.label && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Label
                          </div>
                          <div className="text-base text-foreground font-ui">
                            {track.label}
                          </div>
                        </div>
                      )}

                      {track.genres.length > 0 && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-2">
                            Genres
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {track.genres.map((genre) => (
                              <Badge
                                key={genre}
                                variant="outline"
                                className="font-ui text-xs uppercase tracking-wider"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {track.spotifyUri && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                        Preview Player
                      </div>
                      <SpotifyEmbed 
                        spotifyUri={track.spotifyUri}
                        artist={track.artist}
                        title={track.title}
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                      Listen On
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {track.spotifyUri && (
                        <a
                          href={`https://open.spotify.com/track/${spotifyId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Spotify
                        </a>
                      )}
                      {track.appleMusicUrl && (
                        <a
                          href={track.appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Apple Music
                        </a>
                      )}
                      {track.amazonMusicUrl && (
                        <a
                          href={track.amazonMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Amazon Music
                        </a>
                      )}
                      {track.youtubeUrl && (
                        <a
                          href={track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
