import { useState } from 'react';
import { MusicNote } from '@phosphor-icons/react';

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
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      {hasValidSrc && !imageError ? (
        <div className={`relative w-full h-full aspect-square overflow-hidden ${isHovered ? 'chromatic-hover' : ''}`}>
          {isLoading && showLoadingIndicator && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary animate-pulse">
              <MusicNote size={iconSizes[size]} className="text-muted-foreground/30" weight="fill" />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover instant-transition ${getGlowClass()} ${
              isHovered ? 'scale-110' : 'scale-100'
            } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
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
