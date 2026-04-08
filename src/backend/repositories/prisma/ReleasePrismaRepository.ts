import { IReleasePrismaRepository } from './IReleasePrismaRepository'
import { Release } from '../../models/Release'
import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

export class ReleasePrismaRepository implements IReleasePrismaRepository {
  async getAll(): Promise<Release[]> {
    const releases = await prisma.release.findMany({
      include: { artist: true },
      orderBy: { releaseDate: 'desc' }
    })
    
    return releases.map(this.toDomain)
  }

  async getById(id: string): Promise<Release | null> {
    const release = await prisma.release.findUnique({
      where: { id },
      include: { artist: true }
    })
    
    return release ? this.toDomain(release) : null
  }

  async getBySpotifyId(spotifyId: string): Promise<Release | null> {
    const release = await prisma.release.findUnique({
      where: { spotifyId },
      include: { artist: true }
    })
    
    return release ? this.toDomain(release) : null
  }

  async getByArtistId(artistId: string): Promise<Release[]> {
    const releases = await prisma.release.findMany({
      where: { artistId },
      include: { artist: true },
      orderBy: { releaseDate: 'desc' }
    })
    
    return releases.map(this.toDomain)
  }

  async create(releaseData: Omit<Release, 'id'>): Promise<Release> {
    const vercelBlobUrl = await this.uploadArtworkToBlobIfNeeded(
      releaseData.itunesArtworkUrl
    )
    
    const release = await prisma.release.create({
      data: {
        title: releaseData.title,
        releaseType: releaseData.releaseType || 'single',
        releaseDate: new Date(releaseData.releaseDate),
        spotifyId: releaseData.spotifyId,
        odesliLinks: (releaseData.odesliLinks || {}) as unknown as Prisma.InputJsonObject,
        itunesArtworkUrl: releaseData.itunesArtworkUrl,
        vercelBlobUrl: vercelBlobUrl,
        artistId: releaseData.artistId
      },
      include: { artist: true }
    })
    
    return this.toDomain(release)
  }

  async update(id: string, releaseData: Partial<Release>): Promise<Release> {
    const release = await prisma.release.update({
      where: { id },
      data: {
        ...(releaseData.title && { title: releaseData.title }),
        ...(releaseData.releaseType && { releaseType: releaseData.releaseType }),
        ...(releaseData.releaseDate && { releaseDate: new Date(releaseData.releaseDate) }),
        ...(releaseData.spotifyId && { spotifyId: releaseData.spotifyId }),
        ...(releaseData.odesliLinks && { odesliLinks: releaseData.odesliLinks as unknown as Prisma.InputJsonObject }),
        ...(releaseData.itunesArtworkUrl && { itunesArtworkUrl: releaseData.itunesArtworkUrl }),
        ...(releaseData.vercelBlobUrl && { vercelBlobUrl: releaseData.vercelBlobUrl }),
        ...(releaseData.artistId && { artist: { connect: { id: releaseData.artistId } } })
      },
      include: { artist: true }
    })
    
    return this.toDomain(release)
  }

  async delete(id: string): Promise<void> {
    await prisma.release.delete({
      where: { id }
    })
  }

  async getRecentReleases(limit: number): Promise<Release[]> {
    const releases = await prisma.release.findMany({
      include: { artist: true },
      orderBy: { releaseDate: 'desc' },
      take: limit
    })
    
    return releases.map(this.toDomain)
  }

  private async uploadArtworkToBlobIfNeeded(
    itunesArtworkUrl: string | undefined
  ): Promise<string | undefined> {
    if (!itunesArtworkUrl) return undefined
    
    try {
      if (typeof window === 'undefined' && process.env.BLOB_READ_WRITE_TOKEN) {
        // @ts-ignore - optional server dependency
        const { put } = await import('@vercel/blob')
        
        const imageResponse = await fetch(itunesArtworkUrl)
        const imageBlob = await imageResponse.blob()
        
        const filename = `artwork-${Date.now()}.jpg`
        const blob = await put(filename, imageBlob, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        })
        
        return blob.url
      }
    } catch (error) {
      console.error('Failed to upload artwork to Vercel Blob:', error)
    }
    
    return itunesArtworkUrl
  }

  private toDomain(prismaRelease: any): Release {
    return {
      id: prismaRelease.id,
      title: prismaRelease.title,
      artistName: prismaRelease.artist?.name ?? `[Unknown Artist]`,
      artistId: prismaRelease.artistId,
      releaseType: prismaRelease.releaseType,
      releaseDate: prismaRelease.releaseDate instanceof Date ? prismaRelease.releaseDate : new Date(prismaRelease.releaseDate),
      albumType: 'single',
      totalTracks: 1,
      spotifyId: prismaRelease.spotifyId || undefined,
      odesliLinks: prismaRelease.odesliLinks || undefined,
      itunesArtworkUrl: prismaRelease.itunesArtworkUrl || undefined,
      vercelBlobUrl: prismaRelease.vercelBlobUrl || undefined,
      genres: prismaRelease.artist?.genres || [],
      createdAt: prismaRelease.createdAt instanceof Date ? prismaRelease.createdAt : new Date(prismaRelease.createdAt || Date.now()),
      updatedAt: prismaRelease.updatedAt instanceof Date ? prismaRelease.updatedAt : new Date(prismaRelease.updatedAt || Date.now()),
    }
  }
}
