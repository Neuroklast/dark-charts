import { useState, useMemo, useCallback } from 'react';
import { MainGenre, Genre, ChartType, Track } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState<ChartType>('fan');
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

  const filteredFanCharts = useMemo(() => {
    const mainGenreTracks = filterByMainGenre(fanCharts);
    return filterBySubGenre(mainGenreTracks);
  }, [fanCharts, filterByMainGenre, filterBySubGenre]);

  const filteredExpertCharts = useMemo(() => {
    const mainGenreTracks = filterByMainGenre(expertCharts);
    return filterBySubGenre(mainGenreTracks);
  }, [expertCharts, filterByMainGenre, filterBySubGenre]);

  const filteredStreamingCharts = useMemo(() => {
    const mainGenreTracks = filterByMainGenre(streamingCharts);
    return filterBySubGenre(mainGenreTracks);
  }, [streamingCharts, filterByMainGenre, filterBySubGenre]);

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)} className="space-y-6">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex md:gap-0 bg-card border border-border p-0 h-auto">
          <TabsTrigger 
            value="fan" 
            className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 border-r border-border hover:bg-primary/20"
          >
            Fan Charts
          </TabsTrigger>
          <TabsTrigger 
            value="expert"
            className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 border-r border-border hover:bg-primary/20"
          >
            Expert Charts
          </TabsTrigger>
          <TabsTrigger 
            value="streaming"
            className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 hover:bg-primary/20"
          >
            Streaming
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fan">
          {filteredFanCharts.length > 0 ? (
            <Card className="bg-card border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
                  {mainGenre} Fan Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
                </h2>
              </div>
              <motion.div layout>
                <AnimatePresence mode="popLayout">
                  {filteredFanCharts.map((track, index) => (
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
        </TabsContent>

        <TabsContent value="expert">
          {filteredExpertCharts.length > 0 ? (
            <Card className="bg-card border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
                  {mainGenre} Expert Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
                </h2>
              </div>
              <motion.div layout>
                <AnimatePresence mode="popLayout">
                  {filteredExpertCharts.map((track, index) => (
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
        </TabsContent>

        <TabsContent value="streaming">
          {filteredStreamingCharts.length > 0 ? (
            <Card className="bg-card border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
                  {mainGenre} Streaming Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
                </h2>
              </div>
              <motion.div layout>
                <AnimatePresence mode="popLayout">
                  {filteredStreamingCharts.map((track, index) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
