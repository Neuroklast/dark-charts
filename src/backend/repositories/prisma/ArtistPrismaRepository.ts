import { IArtistRepository } from './IArtistPrismaRepository'
import { Artist } from '../models/Artist'
import prisma from '../lib/prisma'

export class ArtistPrismaRepository implements IArtistRepository {
  async getAll(): Promise<Artist[]> {
    const artists = await prisma.artist.findMany({
      orderBy: { name: 'asc' }
    })
    
    return artists.map(this.toDomain)
  }

  async getById(id: string): Promise<Artist | null> {
    const artist = await prisma.artist.findUnique({
      where: { id }
    })
    
    return artist ? this.toDomain(artist) : null
  }

  async getBySpotifyId(spotifyId: string): Promise<Artist | null> {
    const artist = await prisma.artist.findUnique({
      where: { spotifyId }
    })
    
    return artist ? this.toDomain(artist) : null
  }

  async create(artistData: Omit<Artist, 'id'>): Promise<Artist> {
    const artist = await prisma.artist.create({
      data: {
        name: artistData.name,
        spotifyId: artistData.spotifyId,
        genres: artistData.genres,
        bio: artistData.bio,
        profileLink: artistData.profileLink,
        imageUrl: artistData.imageUrl
      }
    })
    
    return this.toDomain(artist)
  }

  async update(id: string, artistData: Partial<Artist>): Promise<Artist> {
    const artist = await prisma.artist.update({
      where: { id },
      data: {
        ...(artistData.name && { name: artistData.name }),
        ...(artistData.spotifyId && { spotifyId: artistData.spotifyId }),
        ...(artistData.genres && { genres: artistData.genres }),
        ...(artistData.bio && { bio: artistData.bio }),
        ...(artistData.profileLink && { profileLink: artistData.profileLink }),
        ...(artistData.imageUrl && { imageUrl: artistData.imageUrl })
      }
    })
    
    return this.toDomain(artist)
  }

  async delete(id: string): Promise<void> {
    await prisma.artist.delete({
      where: { id }
    })
  }

  async search(query: string): Promise<Artist[]> {
    const artists = await prisma.artist.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20
    })
    
    return artists.map(this.toDomain)
  }

  private toDomain(prismaArtist: any): Artist {
    return {
      id: prismaArtist.id,
      name: prismaArtist.name,
      spotifyId: prismaArtist.spotifyId || undefined,
      genres: prismaArtist.genres || [],
      bio: prismaArtist.bio || undefined,
      profileLink: prismaArtist.profileLink || undefined,
      imageUrl: prismaArtist.imageUrl || undefined
    }
  }
}
