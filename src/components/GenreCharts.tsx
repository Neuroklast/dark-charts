import { useState, useMemo, useCallback } from 'react';
import { MainGenre, Genre, Track } from '@/types';
import { Card } from '@/components/ui/card';
import { ChartEntry } from '@/components/ChartEntry';
import { motion, AnimatePresence } from 'framer-motion';

interface GenreChartsProps {
  mainGenre: MainGenre;
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
  isLoading: boolean;
  onTrackClick: (track: Track) => void;
}

const subGenresByMainGenre: Record<MainGenre, Genre[]> = {
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

export function GenreCharts({ 
  mainGenre, 
  fanCharts, 
  expertCharts, 
  streamingCharts, 
  isLoading,
  onTrackClick 
}: GenreChartsProps) {
  const [selectedSubGenre, setSelectedSubGenre] = useState<Genre | null>(null);

  const subGenres = subGenresByMainGenre[mainGenre];

  const filterByMainGenre = useCallback((tracks: Track[]): Track[] => {
    return tracks.filter(track => {
      return track.genres.some(genre => subGenres.includes(genre));
    });
  }, [subGenres]);

  const filterBySubGenre = useCallback((tracks: Track[]): Track[] => {
    if (!selectedSubGenre) return tracks;
    return tracks.filter(track => track.genres.includes(selectedSubGenre));
  }, [selectedSubGenre]);

  const allTracks = useMemo(() => {
    const combined = [...fanCharts, ...expertCharts, ...streamingCharts];
    const mainGenreTracks = filterByMainGenre(combined);
    return filterBySubGenre(mainGenreTracks);
  }, [fanCharts, expertCharts, streamingCharts, filterByMainGenre, filterBySubGenre]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          {mainGenre} Charts
        </h1>
        
        <div className="flex flex-col gap-3">
          <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            Filter by Subgenre
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubGenre(null)}
              className={`px-3 py-1.5 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition
                ${!selectedSubGenre 
                  ? 'bg-accent border-accent text-accent-foreground' 
                  : 'bg-card border-border hover:bg-accent/20'}`}
            >
              All
            </button>
            {subGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedSubGenre(genre)}
                className={`px-3 py-1.5 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition
                  ${selectedSubGenre === genre 
                    ? 'bg-accent border-accent text-accent-foreground' 
                    : 'bg-card border-border hover:bg-accent/20'}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {allTracks.length > 0 ? (
        <Card className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {mainGenre} Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
            </h2>
          </div>
          <motion.div layout>
            <AnimatePresence mode="popLayout">
              {allTracks.map((track, index) => (
                <motion.div 
                  key={track.id} 
                  onClick={() => onTrackClick(track)} 
                  className="cursor-pointer"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChartEntry track={track} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </Card>
      ) : (
        <Card className="bg-card border border-border p-12 text-center">
          <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
            No tracks found for this selection
          </p>
        </Card>
      )}
    </div>
  );
}
