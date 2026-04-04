import { IiTunesRepository, iTunesSearchResult } from './IiTunesRepository';

export class iTunesSearchAPIRepository implements IiTunesRepository {
  private readonly BASE_URL = 'https://itunes.apple.com/search';
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_BACKOFF_MS = 1000;
  private readonly THROTTLE_DELAY_MS = 2000;
  private lastRequestTime = 0;

  async getHighResArtwork(artistName: string, trackTitle: string): Promise<string | null> {
    await this.throttle();

    const searchTerm = `${artistName} ${trackTitle}`;
    const url = `${this.BASE_URL}?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=5`;
    
    let retries = 0;
    let backoffDelay = this.INITIAL_BACKOFF_MS;

    while (retries <= this.MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'DarkCharts/1.0'
          }
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter 
            ? parseInt(retryAfter, 10) * 1000 
            : backoffDelay;

          console.warn(
            `iTunes rate limit hit for "${artistName} - ${trackTitle}". ` +
            `Retry ${retries + 1}/${this.MAX_RETRIES}. Waiting ${waitTime}ms...`
          );

          await this.sleep(waitTime);
          
          retries++;
          backoffDelay *= 2;
          continue;
        }

        if (!response.ok) {
          if (response.status >= 500 && retries < this.MAX_RETRIES) {
            console.warn(
              `iTunes server error ${response.status} for "${artistName} - ${trackTitle}". ` +
              `Retry ${retries + 1}/${this.MAX_RETRIES}. Waiting ${backoffDelay}ms...`
            );
            await this.sleep(backoffDelay);
            retries++;
            backoffDelay *= 2;
            continue;
          }

          throw new Error(
            `iTunes API request failed: ${response.status} ${response.statusText}`
          );
        }

        const data: iTunesSearchResult = await response.json();
        
        if (!data.results || data.results.length === 0) {
          console.log(`No iTunes results found for "${artistName} - ${trackTitle}"`);
          return null;
        }

        const bestMatch = this.findBestMatch(data.results, artistName, trackTitle);
        
        if (!bestMatch) {
          console.log(`No suitable iTunes match for "${artistName} - ${trackTitle}"`);
          return null;
        }

        const highResArtwork = this.upgradeArtworkUrl(
          bestMatch.artworkUrl100 || bestMatch.artworkUrl60 || bestMatch.artworkUrl30
        );

        return highResArtwork || null;

      } catch (error) {
        if (retries >= this.MAX_RETRIES) {
          console.error(
            `iTunes API failed after ${this.MAX_RETRIES} retries for "${artistName} - ${trackTitle}":`,
            error
          );
          return null;
        }

        console.warn(
          `iTunes request error for "${artistName} - ${trackTitle}". ` +
          `Retry ${retries + 1}/${this.MAX_RETRIES}. Waiting ${backoffDelay}ms...`,
          error
        );

        await this.sleep(backoffDelay);
        retries++;
        backoffDelay *= 2;
      }
    }

    return null;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.THROTTLE_DELAY_MS) {
      const waitTime = this.THROTTLE_DELAY_MS - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  private findBestMatch(
    results: iTunesSearchResult['results'],
    artistName: string,
    trackTitle: string
  ): iTunesSearchResult['results'][0] | null {
    const normalizedArtist = this.normalize(artistName);
    const normalizedTrack = this.normalize(trackTitle);

    for (const result of results) {
      const resultArtist = this.normalize(result.artistName);
      const resultTrack = this.normalize(result.trackName);

      if (
        this.fuzzyMatch(resultArtist, normalizedArtist) &&
        this.fuzzyMatch(resultTrack, normalizedTrack)
      ) {
        return result;
      }
    }

    for (const result of results) {
      const resultArtist = this.normalize(result.artistName);
      if (this.fuzzyMatch(resultArtist, normalizedArtist)) {
        return result;
      }
    }

    return results[0] || null;
  }

  private normalize(str: string | undefined): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private fuzzyMatch(str1: string, str2: string): boolean {
    if (!str1 || !str2) return false;
    return str1.includes(str2) || str2.includes(str1) || str1 === str2;
  }

  private upgradeArtworkUrl(originalUrl: string | undefined): string | null {
    if (!originalUrl) return null;

    const resolutions = [
      { search: '30x30bb', replace: '3000x3000bb' },
      { search: '60x60bb', replace: '3000x3000bb' },
      { search: '100x100bb', replace: '3000x3000bb' },
      { search: '30x30', replace: '3000x3000' },
      { search: '60x60', replace: '3000x3000' },
      { search: '100x100', replace: '3000x3000' }
    ];

    for (const resolution of resolutions) {
      if (originalUrl.includes(resolution.search)) {
        return originalUrl.replace(resolution.search, resolution.replace);
      }
    }

    return originalUrl;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
