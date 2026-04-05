import { MainGenre } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MainGenreNavigationProps {
  activeGenre: MainGenre | 'overall';
  onGenreChange: (genre: MainGenre | 'overall') => void;
  className?: string;
}

export function MainGenreNavigation({ activeGenre, onGenreChange, className }: MainGenreNavigationProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const genres: { value: MainGenre | 'overall'; label: string }[] = [
    { value: 'overall', label: t('genre.overall') },
    { value: 'Gothic', label: t('genre.gothic') },
    { value: 'Metal', label: t('genre.metal') },
    { value: 'Dark Electro', label: t('genre.darkelectro') },
    { value: 'Crossover', label: t('genre.crossover') },
  ];

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeButton = scrollRef.current.querySelector(`[data-genre="${activeGenre}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeGenre, isMobile]);

  return (
    <div className={cn("w-full bg-secondary/30 border-y border-border", className)}>
      <div className="w-full px-4 md:px-8 py-4">
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {genres.map((genre) => (
                <button
                  key={genre.value}
                  data-genre={genre.value}
                  onClick={() => onGenreChange(genre.value)}
                  className={cn(
                    "flex-shrink-0 snap-center px-6 py-3 font-ui text-xs uppercase tracking-[0.15em] font-bold snap-transition border",
                    activeGenre === genre.value
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:bg-accent/20"
                  )}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-0 overflow-hidden border border-border">
              {genres.map((genre) => (
                <button
                  key={genre.value}
                  onClick={() => onGenreChange(genre.value)}
                  className={cn(
                    "flex-1 px-6 py-4 font-ui text-sm uppercase tracking-[0.15em] font-bold snap-transition border-r last:border-r-0 border-border",
                    activeGenre === genre.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  )}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
