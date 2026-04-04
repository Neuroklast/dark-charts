import { useState, useEffect } from 'react';
import { artworkCacheService } from '@/services/artworkCacheService';

interface ProgressiveImageOptions {
  lowQualityUrl?: string;
  highQualityUrl: string;
  priority?: number;
}

export function useProgressiveImage({ lowQualityUrl, highQualityUrl, priority = 1 }: ProgressiveImageOptions) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(lowQualityUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (!highQualityUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsHighQualityLoaded(false);

    if (artworkCacheService.isCached(highQualityUrl)) {
      setCurrentSrc(highQualityUrl);
      setIsHighQualityLoaded(true);
      setIsLoading(false);
      return;
    }

    if (lowQualityUrl) {
      const lowQualityImg = new Image();
      lowQualityImg.onload = () => {
        setCurrentSrc(lowQualityUrl);
      };
      lowQualityImg.src = lowQualityUrl;
    }

    artworkCacheService.preloadArtwork(highQualityUrl, priority)
      .then(() => {
        setCurrentSrc(highQualityUrl);
        setIsHighQualityLoaded(true);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, [highQualityUrl, lowQualityUrl, priority]);

  return {
    src: currentSrc,
    isLoading,
    hasError,
    isHighQualityLoaded
  };
}

export function generateWsrvUrl(originalUrl: string, width: number, quality: number = 80): string {
  if (!originalUrl) return '';
  
  try {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=webp`;
  } catch (error) {
    console.error('Error generating WSRV URL:', error);
    return originalUrl;
  }
}

export function generateImageUrls(originalUrl?: string) {
  if (!originalUrl) {
    return {
      thumbnail: undefined,
      lowQuality: undefined,
      highQuality: undefined,
      original: undefined
    };
  }

  return {
    thumbnail: generateWsrvUrl(originalUrl, 40, 30),
    lowQuality: generateWsrvUrl(originalUrl, 150, 50),
    highQuality: generateWsrvUrl(originalUrl, 400, 85),
    original: originalUrl
  };
}
