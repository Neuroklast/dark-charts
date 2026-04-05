import { Track, ChartType, MainGenre, Genre } from '@/types';
import { Skull } from '@phosphor-icons/react';

interface TrackShareCardProps {
  track: Track;
  chartType?: ChartType;
  mainGenre?: MainGenre;
  subGenre?: Genre;
  artworkUrl?: string;
  position?: {
    position: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export function TrackShareCard({ 
  track, 
  chartType, 
  mainGenre, 
  subGenre, 
  artworkUrl, 
  position 
}: TrackShareCardProps) {
  return (
    <div 
      className="relative w-[600px] h-[315px] bg-background border border-border p-8 flex flex-col justify-between overflow-hidden"
      style={{
        backgroundColor: '#0a0a0a'
      }}
    >
      <div className="flex items-start justify-between z-10">
        <div className="flex gap-6 items-center">
          <div className="w-40 h-40 shadow-2xl border border-white/10 overflow-hidden bg-muted flex items-center justify-center">
            {artworkUrl ? (
              <img 
                src={artworkUrl} 
                alt={track.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Skull size={80} className="text-muted-foreground/40" />
            )}
          </div>

          <div className="space-y-1">
            <div className="font-ui text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              {chartType || 'Official Charts'}
            </div>
            <h2 className="text-2xl font-display uppercase leading-tight text-foreground line-clamp-2">
              {track.title}
            </h2>
            <div className="text-lg text-muted-foreground font-medium">
              {track.artist}
            </div>

            <div className="mt-3 flex gap-4 pt-2">
              {position && (
                <div className="flex flex-col">
                  <span className="font-ui text-[9px] uppercase tracking-widest text-muted-foreground">
                    Position
                  </span>
                  <span className="text-3xl font-display text-primary">
                    #{position.position}
                  </span>
                </div>
              )}
              {mainGenre && (
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="font-ui text-[9px] uppercase tracking-widest text-muted-foreground">
                    Genre
                  </span>
                  <span className="text-sm font-ui uppercase tracking-tighter mt-1">
                    {mainGenre}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end z-10 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded">
            <Skull size={20} weight="fill" className="text-primary-foreground" />
          </div>
          <span className="font-display text-lg uppercase tracking-wider font-bold">
            Dark Charts
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="font-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Independent Music Federation
          </div>
          {subGenre && (
            <div className="text-[9px] text-primary/60 uppercase tracking-widest">
              {subGenre}
            </div>
          )}
        </div>
      </div>

      {/* Hintergrund-Deko */}
      <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
        <Skull size={300} weight="fill" />
      </div>
    </div>
  );
}