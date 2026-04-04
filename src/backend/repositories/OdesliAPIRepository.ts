import { IOdesliRepository, OdesliPlatformLinks, OdesliResponse } from './IOdesliRepository';

export class OdesliAPIRepository implements IOdesliRepository {
  private readonly BASE_URL = 'https://api.song.link/v1-alpha.1/links';
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_BACKOFF_MS = 1000;

  async getStreamingLinks(spotifyId: string): Promise<OdesliPlatformLinks> {
    const url = `${this.BASE_URL}?platform=spotify&type=song&id=${encodeURIComponent(spotifyId)}`;
    
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
            `Odesli rate limit hit for Spotify ID ${spotifyId}. ` +
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
              `Odesli server error ${response.status} for Spotify ID ${spotifyId}. ` +
              `Retry ${retries + 1}/${this.MAX_RETRIES}. Waiting ${backoffDelay}ms...`
            );
            await this.sleep(backoffDelay);
            retries++;
            backoffDelay *= 2;
            continue;
          }

          throw new Error(
            `Odesli API request failed: ${response.status} ${response.statusText}`
          );
        }

        const data: OdesliResponse = await response.json();
        return this.extractPlatformLinks(data);

      } catch (error) {
        if (retries >= this.MAX_RETRIES) {
          console.error(`Odesli API failed after ${this.MAX_RETRIES} retries:`, error);
          throw error;
        }

        console.warn(
          `Odesli request error for Spotify ID ${spotifyId}. ` +
          `Retry ${retries + 1}/${this.MAX_RETRIES}. Waiting ${backoffDelay}ms...`,
          error
        );

        await this.sleep(backoffDelay);
        retries++;
        backoffDelay *= 2;
      }
    }

    throw new Error(`Failed to fetch Odesli data for Spotify ID ${spotifyId} after ${this.MAX_RETRIES} retries`);
  }

  private extractPlatformLinks(data: OdesliResponse): OdesliPlatformLinks {
    const links: OdesliPlatformLinks = {};

    if (data.linksByPlatform) {
      if (data.linksByPlatform.spotify) {
        links.spotify = data.linksByPlatform.spotify.url;
      }
      if (data.linksByPlatform.appleMusic) {
        links.appleMusic = data.linksByPlatform.appleMusic.url;
      }
      if (data.linksByPlatform.youtube) {
        links.youtube = data.linksByPlatform.youtube.url;
      }
      if (data.linksByPlatform.youtubeMusic) {
        links.youtubeMusic = data.linksByPlatform.youtubeMusic.url;
      }
      if (data.linksByPlatform.deezer) {
        links.deezer = data.linksByPlatform.deezer.url;
      }
      if (data.linksByPlatform.tidal) {
        links.tidal = data.linksByPlatform.tidal.url;
      }
      if (data.linksByPlatform.amazon || data.linksByPlatform.amazonMusic) {
        links.amazonMusic = (data.linksByPlatform.amazon || data.linksByPlatform.amazonMusic).url;
      }
      if (data.linksByPlatform.soundcloud) {
        links.soundcloud = data.linksByPlatform.soundcloud.url;
      }
      if (data.linksByPlatform.bandcamp) {
        links.bandcamp = data.linksByPlatform.bandcamp.url;
      }
      if (data.linksByPlatform.pandora) {
        links.pandora = data.linksByPlatform.pandora.url;
      }
    }

    return links;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
