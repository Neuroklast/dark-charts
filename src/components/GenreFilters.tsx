import React from 'react';
import { Genre } from '@/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from '@phosphor-icons/react';

interface GenreFiltersProps {
  availableGenres: Genre[];
  selectedGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
  onClearFilters: () => void;
  className?: string;
}

export const GenreFilters: React.FC<GenreFiltersProps> = ({
  availableGenres,
  selectedGenres,
  onToggleGenre,
  onClearFilters,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          Filter by Genre
        </h3>
        {selectedGenres.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-[10px] uppercase tracking-wider hover:text-destructive"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          
          return (
            <motion.div
              key={genre}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleGenre(genre)}
                className={cn(
                  "h-7 px-3 font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition border",
                  isSelected
                    ? "bg-accent border-accent text-accent-foreground"
                    : "bg-card border-border hover:bg-accent/20 hover:border-accent/50"
                )}
              >
                {genre}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
