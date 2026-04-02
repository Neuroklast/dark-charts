import React, { useState } from 'react';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useDataService } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  trackId: string;
  initialVotes: number;
  className?: string;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({ trackId, initialVotes, className }) => {
  const dataService = useDataService();
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const springVotes = useSpring(votes, { stiffness: 300, damping: 30 });
  const displayVotes = useTransform(springVotes, (latest) => Math.round(latest));

  const handleVote = async (direction: 'up' | 'down') => {
    setIsAnimating(true);
    
    const previousVote = userVote;
    const previousVotes = votes;
    
    if (userVote === direction) {
      setUserVote(null);
      setVotes(votes + (direction === 'up' ? -1 : 1));
    } else if (userVote) {
      setUserVote(direction);
      setVotes(votes + (direction === 'up' ? 2 : -2));
    } else {
      setUserVote(direction);
      setVotes(votes + (direction === 'up' ? 1 : -1));
    }

    try {
      await dataService.vote(trackId, direction);
      const updatedVotes = await dataService.getVotes(trackId);
      setVotes(updatedVotes);
    } catch (error) {
      setUserVote(previousVote);
      setVotes(previousVotes);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        className={cn(
          "h-7 w-7 p-0 transition-all snap-transition hover:bg-accent/20",
          userVote === 'up' && "bg-accent/30 text-accent"
        )}
        disabled={isAnimating}
      >
        <CaretUp weight="bold" className="w-4 h-4" />
      </Button>
      
      <motion.span 
        className="data-font text-sm font-bold text-foreground min-w-[3ch] text-center tabular-nums"
        key={votes}
        initial={{ scale: 1.2, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {votes}
      </motion.span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        className={cn(
          "h-7 w-7 p-0 transition-all snap-transition hover:bg-destructive/20",
          userVote === 'down' && "bg-destructive/30 text-destructive"
        )}
        disabled={isAnimating}
      >
        <CaretDown weight="bold" className="w-4 h-4" />
      </Button>
    </div>
  );
};
