import { useState, useEffect, useRef } from 'react';
import { MusicNote } from '@phosphor-icons/react';
import fallbackImage from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

function encodeImageUrl(url: string): string {
  try {
    return encodeURIComponent(url);
  } catch {
    return url;
  }
}

function generateWsrvUrl(originalUrl: string, width: number, height: number): string {
  if (!originalUrl || originalUrl.trim() === '') return '';
  
  try {
    if (originalUrl.startsWith('data:')) return originalUrl;
    if (originalUrl.includes('wsrv.nl')) return originalUrl;
    
    const encodedUrl = encodeImageUrl(originalUrl);
    return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&dpr=2&output=webp&q=85`;
  } catch (error) {
    console.error('Error generating wsrv.nl URL:', error);
    return originalUrl;
  }
}

export function SafeImage({ 
  src, 
  alt, 
  className = '', 
  width = 200, 
  height = 200,
  onLoad,
  onError,
  priority = false
}: SafeImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setHasError(true);
      setIsLoading(false);
      setFallbackAttempted(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setFallbackAttempted(false);
    
    const wsrvUrl = generateWsrvUrl(src, width, height);
    setCurrentSrc(wsrvUrl);
  }, [src, width, height]);

  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    if (!mountedRef.current) return;
    
    if (!fallbackAttempted && currentSrc !== fallbackImage) {
      setFallbackAttempted(true);
      setCurrentSrc(fallbackImage);
      setIsLoading(true);
      return;
    }
    
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError || !src) {
    return (
      <div className={`bg-zinc-800 flex items-center justify-center ${className}`}>
        <MusicNote size={width / 3} className="text-zinc-600" weight="fill" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-zinc-800 animate-pulse"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  );
}
