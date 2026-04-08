export interface Artist {
  id: string;
  name: string;
  bio?: string;
  country?: string;
  foundedYear?: number;
  imageUrl?: string;
  genres: string[];
  verified: boolean;
  spotifyId?: string;
  profileLink?: string;
  socialLinks?: {
    spotify?: string;
    bandcamp?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArtistDTO {
  name: string;
  bio?: string;
  country?: string;
  foundedYear?: number;
  imageUrl?: string;
  genres: string[];
  socialLinks?: {
    spotify?: string;
    bandcamp?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
}

export interface UpdateArtistDTO {
  name?: string;
  bio?: string;
  country?: string;
  foundedYear?: number;
  imageUrl?: string;
  genres?: string[];
  verified?: boolean;
  socialLinks?: {
    spotify?: string;
    bandcamp?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
}
