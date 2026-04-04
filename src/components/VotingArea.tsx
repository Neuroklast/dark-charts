import { useState, useMemo, useEffect, useCallback } from 'react';
import { Track, Genre } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlass, Info, Lightning, Coins, Calendar } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';
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
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { VotingAreaSkeleton } from '@/components/skeletons';
import { AlbumArtwork } from './AlbumArtwork';

interface VotingAreaProps {
  allTracks: Track[];
  onTrackClick: (track: Track) => void;
}

const MAX_CREDITS = 150;

function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

function calculateQuadraticCost(credits: number): number {
  return credits * credits;
}

export function VotingArea({ allTracks, onTrackClick }: VotingAreaProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [userVotes, setUserVotes] = useKV<Record<string, number>>('user-votes', {});
  const [creditsRemaining, setCreditsRemaining] = useKV<number>('voting-credits', MAX_CREDITS);
  const [tempVoteValues, setTempVoteValues] = useState<Record<string, number>>({});
  const [nextPublishDate] = useState<Date>(getNextMonday());
  const [isLoading, setIsLoading] = useState(true);

  const allGenres = useMemo(() => {
    const genreSet = new Set<Genre>();
    allTracks.forEach(track => {
      track.genres.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [allTracks]);

  const totalCreditsSpent = useMemo(() => {
    if (!userVotes) return 0;
    return Object.values(userVotes).reduce((sum, credits) => {
      return sum + calculateQuadraticCost(credits);
    }, 0);
  }, [userVotes]);

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

  const tracksWithSimulatedVotes = useMemo(() => {
    return filteredTracks.map(track => {
      const userCredit = (userVotes && userVotes[track.id]) || 0;
      const baseVotes = track.votes || 0;
      return {
        ...track,
        simulatedVotes: baseVotes + userCredit,
        userCredits: userCredit
      };
    }).sort((a, b) => b.simulatedVotes - a.simulatedVotes);
  }, [filteredTracks, userVotes]);

  const daysUntilPublish = useMemo(() => {
    const now = new Date();
    const diff = nextPublishDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [nextPublishDate]);

  const handleToggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres(current =>
      current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre]
    );
  }, []);

  const handleVoteChange = useCallback((trackId: string, newCredits: number) => {
    if (!user) {
      toast.error(t?.('voting.loginRequired') || 'Please log in to vote');
      return;
    }

    const currentCredits = (userVotes && userVotes[trackId]) || 0;
    const currentCost = calculateQuadraticCost(currentCredits);
    const newCost = calculateQuadraticCost(newCredits);
    const costDifference = newCost - currentCost;
    const remainingCredits = creditsRemaining || MAX_CREDITS;

    if (costDifference > remainingCredits) {
      const msg = (t?.('voting.notEnoughCredits') || 'Not enough credits! You need {needed} but only have {remaining} remaining.')
        .replace('{needed}', costDifference.toString())
        .replace('{remaining}', remainingCredits.toString());
      toast.error(msg);
      return;
    }

    setUserVotes((current) => {
      const updated = { ...(current || {}) };
      if (newCredits === 0) {
        delete updated[trackId];
      } else {
        updated[trackId] = newCredits;
      }
      return updated;
    });

    setTempVoteValues(current => {
      const updated = { ...current };
      delete updated[trackId];
      return updated;
    });

    const msg = (t?.('voting.successAllocated') || 'Allocated {credits} credits (cost: {cost})')
      .replace('{credits}', newCredits.toString())
      .replace('{cost}', newCost.toString());
    toast.success(msg, {
      duration: 2000
    });
  }, [user, userVotes, creditsRemaining, setUserVotes, t]);

  const handleSliderChange = useCallback((trackId: string, value: number[]) => {
    setTempVoteValues(current => ({
      ...current,
      [trackId]: value[0]
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCreditsRemaining(MAX_CREDITS - totalCreditsSpent);
  }, [totalCreditsSpent, setCreditsRemaining]);

  if (isLoading) {
    return <VotingAreaSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold mb-2">
              {t?.('voting.title') || 'Voting Area'}
            </h1>
            <p className="font-ui text-sm text-muted-foreground">
              {t?.('voting.description') || 'Use quadratic voting to support your favorite tracks'}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Info size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm" side="left">
                <p className="font-ui text-xs leading-relaxed whitespace-pre-line">
                  <strong>{t?.('voting.quadraticVoting') || 'Quadratic Voting'}:</strong><br/>
                  {t?.('voting.quadraticInfo') || 'You have 150 credits to allocate'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Card className="bg-card border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center">
                <Coins size={24} weight="fill" className="text-primary" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {creditsRemaining}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t?.('voting.creditsRemaining') || 'Credits Remaining'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 border border-accent flex items-center justify-center">
                <Lightning size={24} weight="fill" className="text-accent" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {totalCreditsSpent}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t?.('voting.totalCostSpent') || 'Total Cost Spent'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center">
                <Calendar size={24} weight="fill" className="text-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {daysUntilPublish}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t?.('voting.daysUntilCharts') || 'Days Until Charts'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card border border-border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
            />
            <Input
              placeholder={t?.('voting.search') || 'Search tracks or artists...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-ui"
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => setSelectedGenres([])}
            disabled={selectedGenres.length === 0}
            className="font-ui uppercase tracking-wider"
          >
            {t?.('voting.clearFilters') || 'Clear Filters'}
          </Button>
        </div>

        {allGenres.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                {t?.('voting.filterGenres') || 'Filter by Genre'}
              </span>
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
          {tracksWithSimulatedVotes.slice(0, 50).map((track, simulatedIndex) => {
            const userCredits = (userVotes && userVotes[track.id]) || 0;
            const tempValue = tempVoteValues[track.id];
            const sliderValue = tempValue !== undefined ? tempValue : userCredits;
            const remainingCredits = creditsRemaining || MAX_CREDITS;
            const maxAffordable = Math.floor(Math.sqrt(remainingCredits + calculateQuadraticCost(userCredits)));

            return (
              <motion.div
                key={track.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="bg-card border border-border transition-all hover:border-primary/50">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                          {t?.('voting.rank') || 'Rank'}
                        </div>
                        <div className="text-2xl font-display text-primary data-font">
                          #{simulatedIndex + 1}
                        </div>
                      </div>

                      <div 
                        className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onTrackClick(track)}
                      >
                        <AlbumArtwork
                          src={track.albumArt}
                          alt={`${track.artist} - ${track.title}`}
                          artist={track.artist}
                          title={track.title}
                          size="medium"
                          glowColor="primary"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
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

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <Slider
                                value={[sliderValue]}
                                onValueChange={(value) => handleSliderChange(track.id, value)}
                                onValueCommit={(value) => handleVoteChange(track.id, value[0])}
                                max={Math.max(maxAffordable, userCredits)}
                                step={1}
                                className="w-full"
                                disabled={!user}
                              />
                            </div>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="text-center">
                                <div className="data-font text-lg font-bold text-foreground">
                                  {sliderValue}
                                </div>
                                <div className="text-[9px] font-ui uppercase tracking-wider text-muted-foreground">
                                  {t?.('voting.credits') || 'Credits'}
                                </div>
                              </div>
                              <div className="text-muted-foreground font-ui text-xs">=</div>
                              <div className="text-center">
                                <div className="data-font text-lg font-bold text-accent">
                                  {calculateQuadraticCost(sliderValue)}
                                </div>
                                <div className="text-[9px] font-ui uppercase tracking-wider text-muted-foreground">
                                  {t?.('voting.cost') || 'Cost'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {userCredits > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30">
                              <Lightning size={14} weight="fill" className="text-accent" />
                              <span className="font-ui text-[10px] uppercase tracking-wider text-accent">
                                {(t?.('voting.allocated') || 'You allocated {credits} credits to this track').replace('{credits}', userCredits.toString())}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 min-w-[80px]">
                        <Lightning 
                          size={20} 
                          weight="fill" 
                          className="text-accent" 
                        />
                        <motion.div
                          key={track.simulatedVotes}
                          initial={{ scale: 1.3, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="data-font text-2xl font-bold text-foreground"
                        >
                          {track.simulatedVotes}
                        </motion.div>
                        <div className="text-[9px] font-ui uppercase tracking-wider text-muted-foreground text-center">
                          {t?.('voting.totalVotes') || 'Total Votes'}
                        </div>
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
            {t?.('voting.noTracksFound') || 'No tracks found matching your filters'}
          </p>
        </Card>
      )}
    </div>
  );
}
