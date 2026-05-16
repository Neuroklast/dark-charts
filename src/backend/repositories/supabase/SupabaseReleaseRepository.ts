import { supabase } from '@/lib/supabase/client'
import { IReleaseRepository } from '../IReleaseRepository'
import { CreateReleaseDTO, Release } from '../../models/Release'

const toDomain = (row: any): Release => ({
  id: row.id,
  artistId: row.artistId,
  artistName: row.artists?.name ?? row.artistName ?? '',
  title: row.title,
  releaseDate: new Date(row.releaseDate),
  releaseType: row.releaseType ?? undefined,
  albumType: (row.albumType ?? row.releaseType ?? 'single') as Release['albumType'],
  totalTracks: row.totalTracks ?? 1,
  spotifyId: row.spotifyId ?? undefined,
  spotifyUrl: row.spotifyUrl ?? undefined,
  artworkUrl: row.artworkUrl ?? undefined,
  highResArtworkUrl: row.highResArtworkUrl ?? undefined,
  itunesArtworkUrl: row.itunesArtworkUrl ?? undefined,
  vercelBlobUrl: row.vercelBlobUrl ?? undefined,
  odesliLinks: row.odesliLinks ?? undefined,
  platformLinks: row.platformLinks ?? undefined,
  genres: row.genres ?? [],
  label: row.label ?? undefined,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export class SupabaseReleaseRepository implements IReleaseRepository {
  async getAll(): Promise<Release[]> {
    const { data, error } = await supabase
      .from('releases')
      .select('*, artists(name)')
      .order('releaseDate', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch releases: ${error.message}`)
    }

    return (data ?? []).map(toDomain)
  }

  async getById(id: string): Promise<Release | null> {
    const { data, error } = await supabase
      .from('releases')
      .select('*, artists(name)')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch release by id: ${error.message}`)
    }

    return data ? toDomain(data) : null
  }

  async getByArtistId(artistId: string): Promise<Release[]> {
    const { data, error } = await supabase
      .from('releases')
      .select('*, artists(name)')
      .eq('artistId', artistId)
      .order('releaseDate', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch releases by artist: ${error.message}`)
    }

    return (data ?? []).map(toDomain)
  }

  async getBySpotifyId(spotifyId: string): Promise<Release | null> {
    const { data, error } = await supabase
      .from('releases')
      .select('*, artists(name)')
      .eq('spotifyId', spotifyId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch release by Spotify ID: ${error.message}`)
    }

    return data ? toDomain(data) : null
  }

  async exists(artistId: string, title: string, releaseDate: Date): Promise<boolean> {
    const releaseDateOnly = releaseDate.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('releases')
      .select('id, releaseDate')
      .eq('artistId', artistId)
      .ilike('title', title)

    if (error) {
      throw new Error(`Failed to check release existence: ${error.message}`)
    }

    return (data ?? []).some((release) => {
      const existingDate = new Date(release.releaseDate).toISOString().split('T')[0]
      return existingDate === releaseDateOnly
    })
  }

  async create(dto: CreateReleaseDTO): Promise<Release> {
    const extendedDto = dto as CreateReleaseDTO & {
      odesliLinks?: Record<string, unknown>
      itunesArtworkUrl?: string
    }

    const payload = {
      artistId: dto.artistId,
      title: dto.title,
      releaseType: dto.albumType,
      releaseDate: dto.releaseDate.toISOString(),
      spotifyId: dto.spotifyId ?? null,
      spotifyUrl: dto.spotifyUrl ?? null,
      artworkUrl: dto.artworkUrl ?? null,
      highResArtworkUrl: dto.highResArtworkUrl ?? null,
      itunesArtworkUrl: extendedDto.itunesArtworkUrl ?? null,
      platformLinks: dto.platformLinks ?? null,
      odesliLinks: extendedDto.odesliLinks ?? null,
      albumType: dto.albumType,
      totalTracks: dto.totalTracks,
      genres: dto.genres ?? [],
      label: dto.label ?? null,
    }

    const { data, error } = await supabase.from('releases').insert(payload).select('*, artists(name)').single()
    if (error) {
      throw new Error(`Failed to create release: ${error.message}`)
    }

    return toDomain(data)
  }

  async update(id: string, data: Partial<Release>): Promise<Release | null> {
    const payload = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.releaseType !== undefined ? { releaseType: data.releaseType } : {}),
      ...(data.releaseDate !== undefined ? { releaseDate: new Date(data.releaseDate).toISOString() } : {}),
      ...(data.spotifyId !== undefined ? { spotifyId: data.spotifyId } : {}),
      ...(data.spotifyUrl !== undefined ? { spotifyUrl: data.spotifyUrl } : {}),
      ...(data.artworkUrl !== undefined ? { artworkUrl: data.artworkUrl } : {}),
      ...(data.highResArtworkUrl !== undefined ? { highResArtworkUrl: data.highResArtworkUrl } : {}),
      ...(data.platformLinks !== undefined ? { platformLinks: data.platformLinks } : {}),
      ...(data.odesliLinks !== undefined ? { odesliLinks: data.odesliLinks } : {}),
      ...(data.albumType !== undefined ? { albumType: data.albumType } : {}),
      ...(data.totalTracks !== undefined ? { totalTracks: data.totalTracks } : {}),
      ...(data.genres !== undefined ? { genres: data.genres } : {}),
      ...(data.label !== undefined ? { label: data.label } : {}),
      updatedAt: new Date().toISOString(),
    }

    const { data: updated, error } = await supabase
      .from('releases')
      .update(payload)
      .eq('id', id)
      .select('*, artists(name)')
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update release: ${error.message}`)
    }

    return updated ? toDomain(updated) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('releases').delete().eq('id', id)
    return !error
  }

  async getRecentReleases(since: Date): Promise<Release[]> {
    const { data, error } = await supabase
      .from('releases')
      .select('*, artists(name)')
      .gte('releaseDate', since.toISOString())
      .order('releaseDate', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch recent releases: ${error.message}`)
    }

    return (data ?? []).map(toDomain)
  }
}
