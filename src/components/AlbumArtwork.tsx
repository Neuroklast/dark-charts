import { useState, useEffect } from 'react';
import { MusicNote, SpinnerGap } from '@phosphor-icons/react';
import { artworkCacheService } from '@/services/artworkCacheService';

interface AlbumArtworkProps {
  src?: string;
  alt: string;
  artist: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
  glowColor?: string;
  showLoadingIndicator?: boolean;
  priority?: number;
}

export function AlbumArtwork({ 
  src, 
  alt, 
  artist, 
  title, 
  size = 'medium',
  glowColor = 'primary',
  showLoadingIndicator = true,
  priority = 5
}: AlbumArtworkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>();
  const [lowQualitySrc, setLowQualitySrc] = useState<string>();
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageError(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setImageError(false);
    setIsHighQualityLoaded(false);

    const lowQuality = artworkCacheService.generateWsrvUrl(src, 40, 20);
    const highQuality = artworkCacheService.generateWsrvUrl(src, 400, 85);

    setLowQualitySrc(lowQuality);

    const loadLowQuality = new Image();
    loadLowQuality.onload = () => {
      setCurrentSrc(lowQuality);
    };
    loadLowQuality.src = lowQuality;

    if (artworkCacheService.isCached(src)) {
      const cachedUrl = artworkCacheService.getCachedUrl(src);
      if (cachedUrl) {
        setCurrentSrc(cachedUrl);
        setIsHighQualityLoaded(true);
        setIsLoading(false);
      }
      return;
    }

    artworkCacheService.preloadArtwork(src, priority, 400)
      .then((url) => {
        if (url) {
          setCurrentSrc(url);
          setIsHighQualityLoaded(true);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setImageError(true);
        setIsLoading(false);
      });
  }, [src, priority]);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 24,
    medium: 32,
    large: 48
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

  const hasValidSrc = src && src.trim().length > 0;

  return (
    <div 
      className={`relative ${sizeClasses[size]} flex-shrink-0 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasValidSrc && !imageError && currentSrc ? (
        <div className={`relative w-full h-full aspect-square overflow-hidden ${isHovered ? 'chromatic-hover' : ''}`}>
          {!isHighQualityLoaded && lowQualitySrc && (
            <img
              src={lowQualitySrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
              style={{
                imageRendering: 'pixelated'
              }}
            />
          )}
          {isLoading && showLoadingIndicator && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
              <SpinnerGap size={iconSizes[size]} className="text-accent animate-spin" weight="bold" />
            </div>
          )}
          <img
            src={currentSrc}
            alt={alt}
            className={`relative w-full h-full object-cover instant-transition ${getGlowClass()} ${
              isHovered ? 'scale-110' : 'scale-100'
            } ${!isHighQualityLoaded ? 'opacity-0' : 'opacity-100'}`}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
            onLoad={() => {
              if (currentSrc === artworkCacheService.getWsrvUrl(src)) {
                setIsHighQualityLoaded(true);
              }
              setIsLoading(false);
            }}
            loading="lazy"
            style={{
              imageRendering: 'crisp-edges'
            }}
          />
          <div 
            className={`absolute inset-0 border-2 instant-transition pointer-events-none ${getBorderClass()}`}
          />
        </div>
      ) : (
        <div className={`w-full h-full aspect-square bg-secondary border-2 border-border flex items-center justify-center instant-transition ${isHovered ? 'border-primary scale-110' : 'scale-100'} ${getGlowClass()}`}>
          <MusicNote size={iconSizes[size]} className="text-muted-foreground" weight="fill" />
        </div>
      )}
    </div>
  );
}
