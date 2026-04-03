import { Track, OdesliData, CachedTrackData } from '@/types';

const ODESLI_API_BASE = 'https://api.song.link/v1-alpha.1/links';
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
const FAILED_LOOKUP_CACHE_DURATION = 24 * 60 * 60 * 1000;
const ITUNES_RATE_LIMIT = 20;
const ITUNES_RATE_WINDOW = 60 * 1000;
const ODESLI_RATE_LIMIT = 10;
const ODESLI_RATE_WINDOW = 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface FailedLookup {
  trackId: string;
  timestamp: number;
  retryCount: number;
  error: string;
}

class ThrottledRequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private requestCount = 0;
  private windowStart = Date.now();
  private processing = false;
  private maxRequests: number;
  private windowDuration: number;

  constructor(maxRequests: number, windowDuration: number) {
    this.maxRequests = maxRequests;
    this.windowDuration = windowDuration;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      
      if (now - this.windowStart > this.windowDuration) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      if (this.requestCount >= this.maxRequests) {
        const waitTime = this.windowDuration - (now - this.windowStart);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }

      const task = this.queue.shift();
      if (task) {
        this.requestCount++;
        await task();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.processing = false;
  }
}

class TrackEnrichmentService {
  private itunesQueue = new ThrottledRequestQueue(ITUNES_RATE_LIMIT, ITUNES_RATE_WINDOW);
  private odesliQueue = new ThrottledRequestQueue(ODESLI_RATE_LIMIT, ODESLI_RATE_WINDOW);
  private cacheKey = 'track-enrichment-cache-v2';
  private lastSyncKey = 'track-enrichment-last-sync';
  private syncInProgressKey = 'track-enrichment-sync-in-progress';
  private failedLookupsKey = 'track-enrichment-failed-lookups';

  async getCache(): Promise<Map<string, CachedTrackData>> {
    try {
      const cached = await window.spark.kv.get<Record<string, CachedTrackData>>(this.cacheKey);
      return new Map(Object.entries(cached || {}));
    } catch {
      return new Map();
    }
  }

  async setCache(cache: Map<string, CachedTrackData>): Promise<void> {
    try {
      const obj = Object.fromEntries(cache);
      await window.spark.kv.set(this.cacheKey, obj);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  async getFailedLookups(): Promise<Map<string, FailedLookup>> {
    try {
      const failed = await window.spark.kv.get<Record<string, FailedLookup>>(this.failedLookupsKey);
      return new Map(Object.entries(failed || {}));
    } catch {
      return new Map();
    }
  }

  async setFailedLookups(failed: Map<string, FailedLookup>): Promise<void> {
    try {
      const obj = Object.fromEntries(failed);
      await window.spark.kv.set(this.failedLookupsKey, obj);
    } catch (error) {
      console.error('Failed to save failed lookups:', error);
    }
  }

  async markLookupAsFailed(trackId: string, error: string, retryCount: number = 0): Promise<void> {
    const failed = await this.getFailedLookups();
    failed.set(trackId, {
      trackId,
      timestamp: Date.now(),
      retryCount,
      error
    });
    await this.setFailedLookups(failed);
  }

  async shouldRetryFailedLookup(trackId: string): Promise<boolean> {
    const failed = await this.getFailedLookups();
    const lookup = failed.get(trackId);
    
    if (!lookup) return true;
    
    const timeSinceFailed = Date.now() - lookup.timestamp;
    
    if (timeSinceFailed > FAILED_LOOKUP_CACHE_DURATION) {
      return true;
    }
    
    if (lookup.retryCount < MAX_RETRIES && timeSinceFailed > RETRY_DELAY * Math.pow(2, lookup.retryCount)) {
      return true;
    }
    
    return false;
  }

  async getCachedTrackData(trackId: string): Promise<CachedTrackData | null> {
    const cache = await this.getCache();
    const cached = cache.get(trackId);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.lastUpdated;
    if (age > CACHE_DURATION) {
      return null;
    }
    
    return cached;
  }

  async fetchOdesliData(spotifyUri?: string, isrc?: string, trackId?: string): Promise<OdesliData | null> {
    if (!spotifyUri && !isrc) return null;

    if (trackId) {
      const shouldRetry = await this.shouldRetryFailedLookup(`odesli-${trackId}`);
      if (!shouldRetry) {
        return null;
      }
    }

    return this.odesliQueue.enqueue(async () => {
      try {
        let url = ODESLI_API_BASE;
        const params = new URLSearchParams();
        
        if (spotifyUri) {
          const spotifyId = spotifyUri.replace('spotify:track:', '');
          params.append('url', `https://open.spotify.com/track/${spotifyId}`);
        } else if (isrc) {
          params.append('url', `isrc:${isrc}`);
        }

        const response = await fetch(`${url}?${params.toString()}`, {
          headers: {
            'User-Agent': 'DarkCharts/1.0'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          if (trackId) {
            const failed = await this.getFailedLookups();
            const existing = failed.get(`odesli-${trackId}`);
            await this.markLookupAsFailed(`odesli-${trackId}`, `HTTP ${response.status}: ${errorText}`, (existing?.retryCount || 0) + 1);
          }
          console.warn('Odesli API request failed:', response.status, errorText);
          return null;
        }

        const data = await response.json();
        
        if (trackId) {
          const failed = await this.getFailedLookups();
          failed.delete(`odesli-${trackId}`);
          await this.setFailedLookups(failed);
        }
        
        return data as OdesliData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (trackId) {
          const failed = await this.getFailedLookups();
          const existing = failed.get(`odesli-${trackId}`);
          await this.markLookupAsFailed(`odesli-${trackId}`, errorMessage, (existing?.retryCount || 0) + 1);
        }
        console.error('Error fetching Odesli data:', error);
        return null;
      }
    });
  }

  async fetchItunesArtwork(artist: string, title: string, trackId?: string): Promise<{ artworkUrl?: string; previewUrl?: string }> {
    if (trackId) {
      const shouldRetry = await this.shouldRetryFailedLookup(`itunes-${trackId}`);
      if (!shouldRetry) {
        return {};
      }
    }

    return this.itunesQueue.enqueue(async () => {
      try {
        const query = `${artist} ${title}`;
        const params = new URLSearchParams({
          term: query,
          media: 'music',
          entity: 'song',
          limit: '1'
        });

        const response = await fetch(`${ITUNES_SEARCH_API}?${params.toString()}`);
        
        if (!response.ok) {
          if (trackId) {
            const failed = await this.getFailedLookups();
            const existing = failed.get(`itunes-${trackId}`);
            await this.markLookupAsFailed(`itunes-${trackId}`, `HTTP ${response.status}`, (existing?.retryCount || 0) + 1);
          }
          return {};
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          
          if (trackId) {
            const failed = await this.getFailedLookups();
            failed.delete(`itunes-${trackId}`);
            await this.setFailedLookups(failed);
          }
          
          return {
            artworkUrl: result.artworkUrl100?.replace('100x100', '600x600'),
            previewUrl: result.previewUrl
          };
        }

        if (trackId) {
          const failed = await this.getFailedLookups();
          const existing = failed.get(`itunes-${trackId}`);
          await this.markLookupAsFailed(`itunes-${trackId}`, 'No results found', (existing?.retryCount || 0) + 1);
        }

        return {};
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (trackId) {
          const failed = await this.getFailedLookups();
          const existing = failed.get(`itunes-${trackId}`);
          await this.markLookupAsFailed(`itunes-${trackId}`, errorMessage, (existing?.retryCount || 0) + 1);
        }
        console.error('Error fetching iTunes artwork:', error);
        return {};
      }
    });
  }

  async enrichTrack(track: Track): Promise<Track> {
    const cached = await this.getCachedTrackData(track.id);
    
    if (cached) {
      return {
        ...track,
        odesliData: cached.odesliData,
        artworkHighRes: cached.artworkUrl || track.albumArt,
        previewUrl: cached.previewUrl,
        albumArt: cached.artworkUrl || track.albumArt
      };
    }

    const [odesliData, itunesData] = await Promise.all([
      this.fetchOdesliData(track.spotifyUri, track.isrc, track.id),
      this.fetchItunesArtwork(track.artist, track.title, track.id)
    ]);

    const enrichedTrack: Track = {
      ...track,
      odesliData: odesliData || undefined,
      artworkHighRes: itunesData.artworkUrl || track.albumArt,
      previewUrl: itunesData.previewUrl,
      albumArt: itunesData.artworkUrl || track.albumArt
    };

    const cache = await this.getCache();
    cache.set(track.id, {
      trackId: track.id,
      odesliData: odesliData || undefined,
      artworkUrl: itunesData.artworkUrl,
      previewUrl: itunesData.previewUrl,
      lastUpdated: Date.now()
    });
    await this.setCache(cache);

    return enrichedTrack;
  }

  async enrichTracks(tracks: Track[]): Promise<Track[]> {
    const enriched: Track[] = [];
    
    for (const track of tracks) {
      const enrichedTrack = await this.enrichTrack(track);
      enriched.push(enrichedTrack);
    }
    
    return enriched;
  }

  async shouldSync(): Promise<boolean> {
    try {
      const syncInProgress = await window.spark.kv.get<boolean>(this.syncInProgressKey);
      if (syncInProgress) return false;

      const lastSync = await window.spark.kv.get<number>(this.lastSyncKey);
      if (!lastSync) return true;
      
      const timeSinceSync = Date.now() - lastSync;
      return timeSinceSync > CACHE_DURATION;
    } catch {
      return true;
    }
  }

  async syncAllTracks(tracks: Track[]): Promise<void> {
    const shouldSync = await this.shouldSync();
    if (!shouldSync) return;

    try {
      await window.spark.kv.set(this.syncInProgressKey, true);
      
      for (const track of tracks) {
        await this.enrichTrack(track);
      }
      
      await window.spark.kv.set(this.lastSyncKey, Date.now());
    } finally {
      await window.spark.kv.set(this.syncInProgressKey, false);
    }
  }

  async startBackgroundSync(tracks: Track[]): Promise<void> {
    setTimeout(async () => {
      try {
        await this.syncAllTracks(tracks);
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }, 1000);
  }

  async clearFailedLookups(): Promise<void> {
    await window.spark.kv.delete(this.failedLookupsKey);
  }

  async getStats(): Promise<{
    cachedTracks: number;
    failedLookups: number;
    lastSync?: number;
  }> {
    const cache = await this.getCache();
    const failed = await this.getFailedLookups();
    const lastSync = await window.spark.kv.get<number>(this.lastSyncKey);

    return {
      cachedTracks: cache.size,
      failedLookups: failed.size,
      lastSync: lastSync || undefined
    };
  }
}

export const trackEnrichmentService = new TrackEnrichmentService();
