import { useState, useMemo, useEffect } from 'react';
import { Track, Genre, MainGenre } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CaretUp, CaretDown, MagnifyingGlass, Info, Lightning } from '@phosphor-icons/react';
import { useDataService } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VotingAreaProps {
  allTracks: Track[];
  onTrackClick: (track: Track) => void;
}

export function VotingArea({ allTracks, onTrackClick }: VotingAreaProps) {
  const dataService = useDataService();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [trackVotes, setTrackVotes] = useState<Record<string, number>>({});
  const [simulatedRankings, setSimulatedRankings] = useState<Track[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const loadVoteData = async () => {
      const votes: Record<string, number> = {};
      for (const track of allTracks) {
        votes[track.id] = track.votes || 0;
      }
      setTrackVotes(votes);
      calculateSimulatedRankings(votes);
    };
    loadVoteData();
  }, [allTracks]);

  const allGenres = useMemo(() => {
    const genreSet = new Set<Genre>();
    allTracks.forEach(track => {
      track.genres.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [allTracks]);

  const filteredTracks = useMemo(() => {
    let filtered = allTracks;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(search) ||
        track.artist.toLowerCase().includes(search)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(track =>
        track.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return filtered;
  }, [allTracks, searchTerm, selectedGenres]);

  const calculateSimulatedRankings = (votes: Record<string, number>) => {
    setIsCalculating(true);
    
    const tracksWithVotes = allTracks.map(track => ({
      ...track,
      votes: votes[track.id] || track.votes || 0
    }));

    const sorted = [...tracksWithVotes].sort((a, b) => {
      const voteDiff = (b.votes || 0) - (a.votes || 0);
      if (voteDiff !== 0) return voteDiff;
      return (b.fanScore || 0) - (a.fanScore || 0);
    });

    const ranked = sorted.map((track, index) => ({
      ...track,
      rank: index + 1,
      movement: track.rank ? track.rank - (index + 1) : 0
    }));

    setSimulatedRankings(ranked);
    setTimeout(() => setIsCalculating(false), 300);
  };

  const handleVote = async (trackId: string, direction: 'up' | 'down') => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    const previousVote = userVotes[trackId];
    const previousVotes = trackVotes[trackId] || 0;

    let newVoteCount = previousVotes;
    let newUserVote: 'up' | 'down' | undefined;

    if (previousVote === direction) {
      newUserVote = undefined;
      newVoteCount += direction === 'up' ? -1 : 1;
    } else if (previousVote) {
      newUserVote = direction;
      newVoteCount += direction === 'up' ? 2 : -2;
    } else {
      newUserVote = direction;
      newVoteCount += direction === 'up' ? 1 : -1;
    }

    const updatedUserVotes = { ...userVotes };
    if (newUserVote) {
      updatedUserVotes[trackId] = newUserVote;
    } else {
      delete updatedUserVotes[trackId];
    }
    setUserVotes(updatedUserVotes);

    const updatedTrackVotes = { ...trackVotes, [trackId]: newVoteCount };
    setTrackVotes(updatedTrackVotes);
    calculateSimulatedRankings(updatedTrackVotes);

    try {
      await dataService.vote(trackId, direction);
      const actualVotes = await dataService.getVotes(trackId);
      const finalVotes = { ...trackVotes, [trackId]: actualVotes };
      setTrackVotes(finalVotes);
      calculateSimulatedRankings(finalVotes);
      
      toast.success(direction === 'up' ? '🔥 Voted up!' : '👎 Voted down', {
        duration: 2000
      });
    } catch (error) {
      setUserVotes(userVotes);
      const revertedVotes = { ...trackVotes, [trackId]: previousVotes };
      setTrackVotes(revertedVotes);
      calculateSimulatedRankings(revertedVotes);
      toast.error('Vote failed. Please try again.');
    }
  };

  const handleToggleGenre = (genre: Genre) => {
    setSelectedGenres(current =>
      current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre]
    );
  };

  const getCurrentRank = (trackId: string): number => {
    const track = simulatedRankings.find(t => t.id === trackId);
    return track?.rank || 0;
  };

  const getRankChange = (trackId: string): number => {
    const track = simulatedRankings.find(t => t.id === trackId);
    return track?.movement || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold mb-2">
            Voting Area
          </h1>
          <p className="font-ui text-sm text-muted-foreground">
            Vote for your favorite tracks and see real-time impact on the charts
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Info size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="left">
              <p className="font-ui text-xs leading-relaxed">
                <strong>How Voting Works:</strong><br/>
                • Vote UP to increase a track's rank<br/>
                • Vote DOWN to decrease it<br/>
                • See instant impact on chart positions<br/>
                • Your votes combine with fan, expert, and streaming data<br/>
                • Change your vote anytime by clicking again
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="bg-card border border-border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
            />
            <Input
              placeholder="Search tracks or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-ui"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedGenres([])}
                  disabled={selectedGenres.length === 0}
                  className="font-ui uppercase tracking-wider"
                >
                  Clear Filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-ui text-xs">Remove all genre filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {allGenres.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Filter by Genre
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-ui text-xs">Click genres to filter the track list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.slice(0, 15).map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer font-ui text-[10px] uppercase tracking-wider transition-all hover:scale-105"
                  onClick={() => handleToggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTracks.slice(0, 50).map((track) => {
            const currentRank = getCurrentRank(track.id);
            const rankChange = getRankChange(track.id);
            const vote = userVotes[track.id];
            const votes = trackVotes[track.id] || track.votes || 0;

            return (
              <motion.div
                key={track.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
              >
                <Card className={cn(
                  "bg-card border border-border transition-all hover:border-primary/50",
                  isCalculating && "opacity-70"
                )}>
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                          Rank
                        </div>
                        <div className="text-2xl font-display text-primary data-font">
                          #{currentRank || track.rank}
                        </div>
                        {rankChange !== 0 && (
                          <div className={cn(
                            "text-xs font-ui flex items-center gap-1",
                            rankChange > 0 ? "text-accent" : "text-destructive"
                          )}>
                            {rankChange > 0 ? (
                              <>
                                <CaretUp size={12} weight="bold" />
                                +{rankChange}
                              </>
                            ) : (
                              <>
                                <CaretDown size={12} weight="bold" />
                                {rankChange}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {track.albumArt && (
                        <div 
                          className="w-20 h-20 bg-muted cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                          onClick={() => onTrackClick(track)}
                        >
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-display text-lg uppercase tracking-tight text-foreground mb-1 truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => onTrackClick(track)}
                        >
                          {track.title}
                        </h3>
                        <div className="font-ui text-sm text-muted-foreground mb-2">
                          {track.artist}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {track.genres.slice(0, 3).map(genre => (
                            <Badge 
                              key={genre} 
                              variant="secondary" 
                              className="font-ui text-[9px] uppercase tracking-wider"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleVote(track.id, 'up')}
                                variant={vote === 'up' ? 'default' : 'outline'}
                                size="icon"
                                className={cn(
                                  "transition-all",
                                  vote === 'up' && "shadow-lg shadow-primary/50"
                                )}
                              >
                                <CaretUp size={20} weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-ui text-xs">
                                {vote === 'up' ? 'Remove your upvote' : 'Vote this track up'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex flex-col items-center">
                          <Lightning 
                            size={16} 
                            weight="fill" 
                            className="text-accent mb-1" 
                          />
                          <motion.div
                            key={votes}
                            initial={{ scale: 1.3, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="data-font text-lg font-bold text-foreground"
                          >
                            {votes}
                          </motion.div>
                          <div className="text-[9px] font-ui uppercase tracking-wider text-muted-foreground">
                            votes
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleVote(track.id, 'down')}
                                variant={vote === 'down' ? 'destructive' : 'outline'}
                                size="icon"
                                className={cn(
                                  "transition-all",
                                  vote === 'down' && "shadow-lg shadow-destructive/50"
                                )}
                              >
                                <CaretDown size={20} weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-ui text-xs">
                                {vote === 'down' ? 'Remove your downvote' : 'Vote this track down'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTracks.length === 0 && (
        <Card className="bg-card border border-border p-12 text-center">
          <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
            No tracks found matching your filters
          </p>
        </Card>
      )}
    </div>
  );
}
