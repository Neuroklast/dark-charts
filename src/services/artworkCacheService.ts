class ArtworkCacheService {
  private cache: Map<string, string> = new Map();
  private preloadQueue: Set<string> = new Set();
  private isPreloading = false;

  async preloadArtwork(url: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, url);
        resolve(url);
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload artwork: ${url}`);
        reject(new Error(`Failed to load ${url}`));
      };
      
      img.src = url;
    });
  }

  async preloadMultiple(urls: string[]): Promise<void> {
    if (this.isPreloading) {
      urls.forEach(url => this.preloadQueue.add(url));
      return;
    }

    this.isPreloading = true;

    const uniqueUrls = [...new Set([...urls, ...Array.from(this.preloadQueue)])];
    this.preloadQueue.clear();

    const batchSize = 5;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(url => this.preloadArtwork(url))
      );
    }

    this.isPreloading = false;

    if (this.preloadQueue.size > 0) {
      await this.preloadMultiple([]);
    }
  }

  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  getCachedUrl(url: string): string | undefined {
    return this.cache.get(url);
  }

  clearCache(): void {
    this.cache.clear();
    this.preloadQueue.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats() {
    return {
      cached: this.cache.size,
      queued: this.preloadQueue.size,
      isPreloading: this.isPreloading
    };
  }
}

export const artworkCacheService = new ArtworkCacheService();
