import { MainGenre, Genre } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Funnel } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SubGenreNavigationProps {
  mainGenre: MainGenre;
  activeSubGenre: Genre | null;
  onSubGenreChange: (genre: Genre | null) => void;
  className?: string;
}

const subGenreMap: Record<MainGenre, Genre[]> = {
  'Gothic': [
    'Gothic Rock', 'Dark Wave', 'Post Punk', 'Deathrock', 'Cold Wave',
    'Ethereal Wave', 'Neoklassik', 'Neue Deutsche Todeskunst', 'Batcave',
    'Neofolk', 'Pagan Folk', 'Nordic Folk', 'Ritual Ambient'
  ],
  'Metal': [
    'Gothic Metal', 'Dark Metal', 'Symphonic Metal', 'Doom Metal',
    'Symphonic Black Metal', 'Atmospheric Black Metal', 'Death Doom', 'Pagan Metal'
  ],
  'Dark Electro': [
    'Electronic Body Music', 'Dark Electro', 'Electro Industrial', 'Aggrotech',
    'Future Pop', 'Industrial', 'Rhythmic Noise', 'Dark Synthpop', 'Harsh EBM'
  ],
  'Crossover': [
    'Industrial Metal', 'Neue Deutsche Härte', 'Mittelalter Rock', 'Darksynth',
    'Cybergoth', 'Death Industrial', 'Folk Metal', 'Dark Techno',
    'Industrial Techno', 'Darkstep', 'Crossbreed', 'Techstep', 'Neurofunk'
  ]
};

export function SubGenreNavigation({ mainGenre, activeSubGenre, onSubGenreChange, className }: SubGenreNavigationProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const subGenres = subGenreMap[mainGenre] || [];

  const handleSubGenreSelect = (genre: Genre | null) => {
    onSubGenreChange(genre);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div className={cn("px-4", className)}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="w-full flex items-center justify-between px-6 py-4 bg-card border border-border hover:bg-accent/20 snap-transition">
              <span className="font-ui text-xs uppercase tracking-[0.15em] font-bold text-foreground">
                {activeSubGenre || 'All Subgenres'}
              </span>
              <Funnel weight="bold" className="w-5 h-5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-background border-t border-border">
            <SheetHeader className="border-b border-border pb-4 mb-4">
              <SheetTitle className="font-ui text-lg uppercase tracking-[0.15em] font-bold text-foreground">
                {mainGenre} Subgenres
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 overflow-y-auto h-[calc(80vh-100px)]">
              <button
                onClick={() => handleSubGenreSelect(null)}
                className={cn(
                  "w-full px-6 py-4 text-left font-ui text-sm uppercase tracking-[0.1em] font-semibold snap-transition border",
                  activeSubGenre === null
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:bg-accent/20"
                )}
              >
                All Subgenres
              </button>
              {subGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleSubGenreSelect(genre)}
                  className={cn(
                    "w-full px-6 py-4 text-left font-ui text-sm uppercase tracking-[0.1em] font-semibold snap-transition border",
                    activeSubGenre === genre
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:bg-accent/20"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mainGenre}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'linear' }}
        className={cn("overflow-hidden", className)}
      >
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-4">
          <button
            onClick={() => onSubGenreChange(null)}
            className={cn(
              "px-5 py-2 font-ui text-xs uppercase tracking-[0.12em] font-bold snap-transition border",
              activeSubGenre === null
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-secondary text-secondary-foreground border-border hover:bg-accent/20"
            )}
          >
            All
          </button>
          {subGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => onSubGenreChange(genre)}
              className={cn(
                "px-5 py-2 font-ui text-xs uppercase tracking-[0.12em] font-bold snap-transition border",
                activeSubGenre === genre
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-accent/20"
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
