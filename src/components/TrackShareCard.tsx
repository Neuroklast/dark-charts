import { Track, ChartType, MainGenre, Genre } from '@/types';
import { Skull } from '@phosphor-icons/react';

interface ChartPosition {
  chartName: string;
  position: number;
  chartType?: ChartType;
  mainGenre?: MainGenre;
  subGenre?: Genre;
}

interface TrackShareProps {
  track: Track;
  artworkUrl?: string;
  position?: {
    position: number;
    trend: 'up' | 'down' | 'neutral';
  };
  chartPositions?: ChartPosition[];
}

export function TrackShareCard({ track, artworkUrl, position, chartPositions }: TrackShareProps) {
  return (
    <div 
      className="relative w-[600px] h-[315px] border border-border p-8 flex flex-col justify-between overflow-hidden"
      style={{
        backgroundColor: '#000000',
        backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
      }}
    >
      <div className="flex items-start justify-between z-10">
        <div className="flex gap-6 items-start w-full">
          <div className="w-40 h-40 shadow-2xl border border-white/10 overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
            {artworkUrl ? (
              <img 
                src={artworkUrl} 
                alt={track.title} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Skull size={80} style={{ color: '#666666' }} />
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="font-ui text-xs uppercase tracking-[0.2em] font-bold" style={{ color: '#8b5cf6' }}>
              Now Charting
            </div>
            <h2 className="text-3xl font-display uppercase leading-tight line-clamp-2" style={{ color: '#ffffff' }}>
              {track.title}
            </h2>
            <div className="text-xl font-medium" style={{ color: '#cccccc' }}>
              {track.artist}
            </div>
            
            {chartPositions && chartPositions.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 pt-2">
                {chartPositions.slice(0, 6).map((pos, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-ui text-[9px] uppercase tracking-widest" style={{ color: '#999999' }}>
                      {pos.chartName.replace(' Charts', '').substring(0, 12)}
                    </span>
                    <span className="text-xl font-display data-font" style={{ color: '#8b5cf6' }}>
                      #{pos.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end z-10 border-t pt-4" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5" style={{ backgroundColor: '#8b5cf6' }}>
            <Skull size={20} weight="fill" style={{ color: '#000000' }} />
          </div>
          <span className="font-display text-lg uppercase tracking-wider font-bold" style={{ color: '#ffffff' }}>
            Dark Charts
          </span>
        </div>
        
        <div className="font-ui text-[10px] uppercase tracking-[0.3em]" style={{ color: '#999999' }}>
          Independent Music Federation
        </div>
      </div>

      <div className="absolute -right-20 -bottom-20 pointer-events-none" style={{ opacity: 0.05 }}>
        <Skull size={300} weight="fill" style={{ color: '#ffffff' }} />
      </div>
    </div>
  );
}