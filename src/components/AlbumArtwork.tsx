import { useState, useEffect } from 'react';
import { artworkCacheService } from '@/services/artworkCacheService';

interface AlbumArtworkProps {
  src?: string;
  alt: string;
  artist: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
  glowColor?: string;
  showLoadingIndicator?: boolean;
}

export function AlbumArtwork({ 
  src, 
  alt, 
  artist, 
  title, 
  size = 'medium',
  glowColor = 'primary',
  showLoadingIndicator = true
}: AlbumArtworkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setLoadedSrc(src);
      setIsLoading(false);
      artworkCacheService.preloadArtwork(src);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const getGlowClass = () => {
    if (glowColor === 'accent') return 'group-hover:glow-accent';
    if (glowColor === 'violet') return 'group-hover:glow-violet';
    return 'group-hover:glow-primary';
  };

  const getBorderClass = () => {
    if (!isHovered) return 'border-transparent';
    if (glowColor === 'accent') return 'border-accent';
    if (glowColor === 'violet') return 'border-violet';
    return 'border-primary';
  };

  const placeholderText = artist.charAt(0).toUpperCase();

  return (
    <div 
      className={`relative ${sizeClasses[size]} flex-shrink-0 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && showLoadingIndicator ? (
        <div className="w-full h-full bg-secondary border-2 border-border flex items-center justify-center animate-pulse">
          <div className="w-3 h-3 bg-muted-foreground/30 rounded-full animate-ping" />
        </div>
      ) : loadedSrc && !hasError ? (
        <div className={`relative w-full h-full overflow-hidden ${isHovered ? 'chromatic-hover' : ''}`}>
          <img
            src={loadedSrc}
            alt={alt}
            className={`w-full h-full object-cover instant-transition ${getGlowClass()} ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            style={{
              imageRendering: 'crisp-edges'
            }}
          />
          <div 
            className={`absolute inset-0 border-2 instant-transition pointer-events-none ${getBorderClass()}`}
          />
        </div>
      ) : (
        <div className={`w-full h-full bg-secondary border-2 border-border flex items-center justify-center instant-transition ${isHovered ? 'border-primary scale-110' : 'scale-100'} ${getGlowClass()}`}>
          <span className="display-font text-4xl text-muted-foreground font-bold">
            {placeholderText}
          </span>
        </div>
      )}
    </div>
  );
}
