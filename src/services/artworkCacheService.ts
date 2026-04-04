import { Track } from '@/types';

interface PreloadPriority {
  url: string;
  priority: number;
  timestamp: number;
}

interface CachedImage {
  url: string;
  wsrvUrl: string;
  timestamp: number;
}

class ArtworkCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private preloadQueue: Map<string, PreloadPriority> = new Map();
  private isPreloading = false;
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private failedUrls: Set<string> = new Set();
  private maxCacheSize = 200;

  generateWsrvUrl(originalUrl: string, width: number = 400, quality: number = 85): string {
    if (!originalUrl) return '';
    
    try {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=webp&we`;
    } catch (error) {
      console.error('Error generating WSRV URL:', error);
      return originalUrl;
    }
  }

  async preloadArtwork(url: string, priority: number = 0, width: number = 400): Promise<string> {
    if (!url) return '';
    
    if (this.cache.has(url)) {
      return this.cache.get(url)!.wsrvUrl;
    }

    if (this.failedUrls.has(url)) {
      return '';
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const wsrvUrl = this.generateWsrvUrl(url, width);

    const loadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.cache.set(url, {
          url,
          wsrvUrl,
          timestamp: Date.now()
        });
        this.loadingPromises.delete(url);
        this.preloadQueue.delete(url);
        
        if (this.cache.size > this.maxCacheSize) {
          this.evictOldestEntries();
        }
        
        resolve(wsrvUrl);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(url);
        this.preloadQueue.delete(url);
        this.failedUrls.add(url);
        resolve('');
      };
      
      img.src = wsrvUrl;
    });

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  async preloadMultiple(urls: string[], priority: number = 0, width: number = 400): Promise<void> {
    const validUrls = urls.filter(url => url && !this.cache.has(url) && !this.failedUrls.has(url));
    
    validUrls.forEach(url => {
      this.preloadQueue.set(url, {
        url,
        priority,
        timestamp: Date.now()
      });
    });

    if (!this.isPreloading) {
      this.processQueue(width);
    }
  }

  private async processQueue(width: number = 400): Promise<void> {
    if (this.isPreloading || this.preloadQueue.size === 0) {
      return;
    }

    this.isPreloading = true;

    const sortedQueue = Array.from(this.preloadQueue.values())
      .sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);

    const batchSize = 3;
    
    while (sortedQueue.length > 0) {
      const batch = sortedQueue.splice(0, batchSize);
      await Promise.allSettled(
        batch.map(item => this.preloadArtwork(item.url, item.priority, width))
      );
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isPreloading = false;

    if (this.preloadQueue.size > 0) {
      this.processQueue(width);
    }
  }

  preloadUpcomingTracks(currentTrack: Track, allTracks: Track[], lookAhead: number = 3): void {
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    const upcomingTracks = allTracks.slice(currentIndex + 1, currentIndex + 1 + lookAhead);
    const previousTracks = allTracks.slice(Math.max(0, currentIndex - lookAhead), currentIndex);

    const upcomingUrls = upcomingTracks
      .map(t => t.artworkHighRes || t.albumArt)
      .filter((url): url is string => !!url);

    const previousUrls = previousTracks
      .map(t => t.artworkHighRes || t.albumArt)
      .filter((url): url is string => !!url);

    this.preloadMultiple(upcomingUrls, 10);
    this.preloadMultiple(previousUrls, 5);
  }

  preloadVisibleTracks(tracks: Track[], priority: number = 8): void {
    const urls = tracks
      .map(t => t.artworkHighRes || t.albumArt)
      .filter((url): url is string => !!url);
    
    this.preloadMultiple(urls, priority);
  }

  private evictOldestEntries(): void {
    const entriesToRemove = this.cache.size - this.maxCacheSize + 20;
    const entries = Array.from(this.cache.keys());
    
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      this.cache.delete(entries[i]);
    }
  }

  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  getCachedUrl(url: string): string | undefined {
    const cached = this.cache.get(url);
    return cached ? cached.wsrvUrl : undefined;
  }

  getWsrvUrl(url: string): string | undefined {
    if (this.cache.has(url)) {
      return this.cache.get(url)!.wsrvUrl;
    }
    return this.generateWsrvUrl(url);
  }

  clearCache(): void {
    this.cache.clear();
    this.preloadQueue.clear();
    this.loadingPromises.clear();
    this.failedUrls.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats() {
    return {
      cached: this.cache.size,
      queued: this.preloadQueue.size,
      isPreloading: this.isPreloading,
      loading: this.loadingPromises.size,
      failed: this.failedUrls.size
    };
  }

  resetFailedUrls(): void {
    this.failedUrls.clear();
  }
}

export const artworkCacheService = new ArtworkCacheService();
