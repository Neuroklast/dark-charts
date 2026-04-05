import { Track } from '@/types';
import { Skull } from '@phosphor-icons/react';

interface TrackShareProps {
  track: Track;
  artworkUrl?: string;
  position?: {
    position: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export function TrackShareCard({ track, artworkUrl, position }: TrackShareProps) {
  return (
    <div 
      className="relative w-[600px] h-[315px] bg-background border border-border p-8 flex flex-col justify-between overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
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

          <div className="space-y-2">
            <div className="font-ui text-xs uppercase tracking-[0.2em] text-primary font-bold">
              Now Charting
            </div>
            <h2 className="text-3xl font-display uppercase leading-tight text-foreground line-clamp-2">
              {track.title}
            </h2>
            <div className="text-xl text-muted-foreground font-medium">
              {track.artist}
            </div>
            
            {position && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                    Chart Position
                  </span>
                  <span className="text-4xl font-display text-primary">
                    #{position.position}
                  </span>
                </div>
              </div>
            )}
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
        
        <div className="font-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Independent Music Federation
        </div>
      </div>

      {/* Hintergrund-Deko */}
      <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
        <Skull size={300} weight="fill" />
      </div>
    </div>
  );
}