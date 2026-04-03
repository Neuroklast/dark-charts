import { useState, useMemo, useCallback, useEffect } from 'react';
import { MainGenre, Genre, Track, ChartType } from '@/types';
import { Card } from '@/components/ui/card';
import { ChartEntry } from '@/components/ChartEntry';
import { motion, AnimatePresence } from 'framer-motion';

interface GenreChartsProps {
  mainGenre: MainGenre;
  activePillar: ChartType | 'overview';
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
  activePillar,
  fanCharts, 
  expertCharts, 
  streamingCharts, 
  isLoading,
  onTrackClick 
}: GenreChartsProps) {
  const [selectedSubGenre, setSelectedSubGenre] = useState<Genre | null>(null);

  const subGenres = subGenresByMainGenre[mainGenre];

  useEffect(() => {
    setSelectedSubGenre(null);
  }, [mainGenre]);

  const filterByMainGenre = useCallback((tracks: Track[]): Track[] => {
    return tracks.filter(track => {
      return track.genres.some(genre => subGenres.includes(genre));
    });
  }, [subGenres]);

  const filterBySubGenre = useCallback((tracks: Track[]): Track[] => {
    if (!selectedSubGenre) return tracks;
    return tracks.filter(track => track.genres.includes(selectedSubGenre));
  }, [selectedSubGenre]);

  const getFilteredCharts = useCallback((tracks: Track[]) => {
    const mainGenreTracks = filterByMainGenre(tracks);
    const filtered = filterBySubGenre(mainGenreTracks);
    return filtered.slice(0, 10);
  }, [filterByMainGenre, filterBySubGenre]);

  const filteredFanCharts = useMemo(() => getFilteredCharts(fanCharts), [fanCharts, getFilteredCharts]);
  const filteredExpertCharts = useMemo(() => getFilteredCharts(expertCharts), [expertCharts, getFilteredCharts]);
  const filteredStreamingCharts = useMemo(() => getFilteredCharts(streamingCharts), [streamingCharts, getFilteredCharts]);

  const filteredOverallCharts = useMemo(() => {
    const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];
    const mainGenreTracks = filterByMainGenre(allTracks);
    const filtered = filterBySubGenre(mainGenreTracks);
    
    const uniqueTracksMap = new Map<string, Track>();
    filtered.forEach(track => {
      if (!uniqueTracksMap.has(track.id)) {
        uniqueTracksMap.set(track.id, track);
      }
    });
    
    const uniqueTracks = Array.from(uniqueTracksMap.values());
    uniqueTracks.sort((a, b) => {
      const scoreA = (a.fanScore || 0) + (a.expertScore || 0) + (a.streamingScore || 0);
      const scoreB = (b.fanScore || 0) + (b.expertScore || 0) + (b.streamingScore || 0);
      return scoreB - scoreA;
    });
    
    return uniqueTracks.slice(0, 10);
  }, [fanCharts, expertCharts, streamingCharts, filterByMainGenre, filterBySubGenre]);

  const currentChartTracks = useMemo(() => {
    if (activePillar === 'overview') return filteredOverallCharts;
    if (activePillar === 'fan') return filteredFanCharts;
    if (activePillar === 'expert') return filteredExpertCharts;
    if (activePillar === 'streaming') return filteredStreamingCharts;
    return filteredOverallCharts;
  }, [activePillar, filteredOverallCharts, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts]);

  const chartTypeLabel = useMemo(() => {
    if (activePillar === 'overview') return 'Overall';
    if (activePillar === 'fan') return 'Fan';
    if (activePillar === 'expert') return 'Expert';
    if (activePillar === 'streaming') return 'Streaming';
    return 'Overall';
  }, [activePillar]);

  const renderChartSection = (tracks: Track[]) => {
    if (tracks.length === 0) {
      return (
        <Card className="bg-card border border-border p-12 text-center">
          <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
            No tracks found for this selection
          </p>
        </Card>
      );
    }

    return (
      <Card className="bg-card border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
            {mainGenre} {chartTypeLabel} Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
          </h2>
        </div>
        <motion.div layout>
          <AnimatePresence mode="popLayout">
            {tracks.map((track, index) => (
              <motion.div 
                key={track.id}
                layoutId={`track-${track.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.15 }
                }}
                onClick={() => onTrackClick(track)} 
                className="cursor-pointer"
              >
                <ChartEntry track={{ ...track, rank: index + 1 }} index={index} animate={true} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </Card>
    );
  };

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

      <div className="mt-6">
        {renderChartSection(currentChartTracks)}
      </div>
    </div>
  );
}
