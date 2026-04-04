export interface OdesliPlatformLinks {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  youtubeMusic?: string;
  deezer?: string;
  tidal?: string;
  amazonMusic?: string;
  soundcloud?: string;
  bandcamp?: string;
  pandora?: string;
}

export interface OdesliEntity {
  id: string;
  type: string;
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
  apiProvider: string;
  platforms: string[];
}

export interface OdesliResponse {
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  linksByPlatform: Record<string, {
    url: string;
    nativeAppUriMobile?: string;
    nativeAppUriDesktop?: string;
    entityUniqueId: string;
  }>;
  entitiesByUniqueId: Record<string, OdesliEntity>;
}

export interface IOdesliRepository {
  getStreamingLinks(spotifyId: string): Promise<OdesliPlatformLinks>;
}
