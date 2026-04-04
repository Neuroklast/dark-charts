import { IArtistRepository } from '../repositories/IArtistRepository';
import { IReleaseRepository } from '../repositories/IReleaseRepository';
import { ISpotifyRepository } from '../repositories/ISpotifyRepository';
import { IOdesliRepository } from '../repositories/IOdesliRepository';
import { IiTunesRepository } from '../repositories/IiTunesRepository';
import { Artist } from '../models/Artist';
import { Release, CreateReleaseDTO, SpotifyAlbum, PlatformLinks } from '../models/Release';

export interface ReleaseImportOptions {
  sinceDate?: Date;
  maxReleasesPerArtist?: number;
}

export interface ImportResult {
  totalArtistsProcessed: number;
  totalReleasesImported: number;
  skippedDuplicates: number;
  errors: Array<{ artistId: string; artistName: string; error: string }>;
}

export class ReleaseImportService {
  constructor(
    private artistRepository: IArtistRepository,
    private releaseRepository: IReleaseRepository,
    private spotifyRepository: ISpotifyRepository,
    private odesliRepository: IOdesliRepository,
    private iTunesRepository: IiTunesRepository
  ) {}

  async importNewReleases(options: ReleaseImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = {
      totalArtistsProcessed: 0,
      totalReleasesImported: 0,
      skippedDuplicates: 0,
      errors: []
    };

    const sinceDate = options.sinceDate || this.getDefaultSinceDate();
    const maxReleasesPerArtist = options.maxReleasesPerArtist || 50;

    try {
      const accessToken = await this.spotifyRepository.authenticate();
      const allArtists = await this.artistRepository.findAll();
      
      const artistsWithSpotify = allArtists.filter((artist: Artist) => 
        artist.socialLinks?.spotify
      );

      console.log(`Processing ${artistsWithSpotify.length} artists with Spotify links...`);

      for (const artist of artistsWithSpotify) {
        try {
          await this.processArtistReleases(
            artist,
            accessToken,
            sinceDate,
            maxReleasesPerArtist,
            result
          );
          result.totalArtistsProcessed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            artistId: artist.id,
            artistName: artist.name,
            error: errorMessage
          });
          console.error(`Error processing artist ${artist.name}:`, error);
        }
      }

      console.log(`Import completed. Processed ${result.totalArtistsProcessed} artists, imported ${result.totalReleasesImported} releases, skipped ${result.skippedDuplicates} duplicates, ${result.errors.length} errors.`);
      
      return result;
    } catch (error) {
      console.error('Fatal error during release import:', error);
      throw error;
    }
  }

  private async processArtistReleases(
    artist: Artist,
    accessToken: string,
    sinceDate: Date,
    maxReleases: number,
    result: ImportResult
  ): Promise<void> {
    if (!artist.socialLinks?.spotify) {
      return;
    }

    const spotifyArtistId = this.extractSpotifyArtistId(artist.socialLinks.spotify);
    if (!spotifyArtistId) {
      console.warn(`Could not extract Spotify ID from ${artist.socialLinks.spotify}`);
      return;
    }

    const spotifyAlbums = await this.spotifyRepository.getArtistAlbums(
      spotifyArtistId,
      accessToken
    );

    const recentReleases = this.filterReleasesByDate(spotifyAlbums, sinceDate);
    const limitedReleases = recentReleases.slice(0, maxReleases);

    for (const spotifyAlbum of limitedReleases) {
      try {
        await this.importSingleRelease(artist, spotifyAlbum, result);
      } catch (error) {
        console.error(`Error importing release ${spotifyAlbum.name} for ${artist.name}:`, error);
      }
    }
  }

  private async importSingleRelease(
    artist: Artist,
    spotifyAlbum: SpotifyAlbum,
    result: ImportResult
  ): Promise<void> {
    const releaseDate = new Date(spotifyAlbum.release_date);
    
    const exists = await this.releaseRepository.exists(
      artist.id,
      spotifyAlbum.name,
      releaseDate
    );

    if (exists) {
      result.skippedDuplicates++;
      return;
    }

    const existingBySpotifyId = await this.releaseRepository.getBySpotifyId(spotifyAlbum.id);
    if (existingBySpotifyId) {
      result.skippedDuplicates++;
      return;
    }

    const spotifyArtworkUrl = spotifyAlbum.images && spotifyAlbum.images.length > 0
      ? spotifyAlbum.images[0].url
      : undefined;

    let platformLinks: PlatformLinks = {};
    try {
      platformLinks = await this.odesliRepository.getStreamingLinks(spotifyAlbum.id);
      console.log(`Fetched platform links for ${artist.name} - ${spotifyAlbum.name}`);
    } catch (error) {
      console.warn(`Failed to fetch Odesli links for ${artist.name} - ${spotifyAlbum.name}:`, error);
    }

    let highResArtworkUrl: string | null = null;
    try {
      highResArtworkUrl = await this.iTunesRepository.getHighResArtwork(
        artist.name,
        spotifyAlbum.name
      );
      
      if (highResArtworkUrl) {
        console.log(`Fetched high-res artwork from iTunes for ${artist.name} - ${spotifyAlbum.name}`);
      }
    } catch (error) {
      console.warn(
        `iTunes artwork fetch failed for ${artist.name} - ${spotifyAlbum.name}, ` +
        `falling back to Spotify artwork:`,
        error
      );
    }

    const releaseDTO: CreateReleaseDTO = {
      artistId: artist.id,
      artistName: artist.name,
      title: spotifyAlbum.name,
      releaseDate,
      albumType: this.normalizeAlbumType(spotifyAlbum.album_type),
      totalTracks: spotifyAlbum.total_tracks,
      spotifyId: spotifyAlbum.id,
      spotifyUrl: spotifyAlbum.external_urls.spotify,
      artworkUrl: spotifyArtworkUrl,
      highResArtworkUrl: highResArtworkUrl || spotifyArtworkUrl,
      platformLinks,
      genres: artist.genres || [],
      label: spotifyAlbum.label
    };

    await this.releaseRepository.create(releaseDTO);
    result.totalReleasesImported++;
    
    console.log(
      `Imported: ${artist.name} - ${spotifyAlbum.name} (${spotifyAlbum.album_type}) ` +
      `[Platforms: ${Object.keys(platformLinks).length}, High-Res: ${highResArtworkUrl ? 'Yes' : 'Fallback'}]`
    );
  }

  private filterReleasesByDate(albums: SpotifyAlbum[], sinceDate: Date): SpotifyAlbum[] {
    return albums.filter(album => {
      const releaseDate = new Date(album.release_date);
      return releaseDate >= sinceDate;
    });
  }

  private normalizeAlbumType(spotifyType: string): 'album' | 'single' | 'ep' | 'compilation' {
    const normalized = spotifyType.toLowerCase();
    if (normalized === 'album') return 'album';
    if (normalized === 'single') return 'single';
    if (normalized === 'compilation') return 'compilation';
    return 'ep';
  }

  private extractSpotifyArtistId(spotifyUrl: string): string | null {
    const patterns = [
      /spotify\.com\/artist\/([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]+)$/
    ];

    for (const pattern of patterns) {
      const match = spotifyUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private getDefaultSinceDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
  }
}
