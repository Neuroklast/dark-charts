import { supabase } from '@/lib/supabase/client'
import { Artist, CreateArtistDTO, UpdateArtistDTO } from '../../models/Artist'
import { IArtistRepository } from '../IArtistRepository'

const toDomain = (row: any): Artist => ({
  id: row.id,
  name: row.name,
  bio: row.bio ?? undefined,
  country: row.country ?? undefined,
  foundedYear: row.foundedYear ?? undefined,
  imageUrl: row.imageUrl ?? undefined,
  genres: row.genres ?? [],
  verified: row.verified ?? false,
  spotifyId: row.spotifyId ?? undefined,
  profileLink: row.profileLink ?? undefined,
  socialLinks: row.socialLinks ?? undefined,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export class SupabaseArtistRepository implements IArtistRepository {
  async findAll(): Promise<Artist[]> {
    const { data, error } = await supabase.from('artists').select('*').order('name')
    if (error) {
      throw new Error(`Failed to fetch artists: ${error.message}`)
    }
    return (data ?? []).map(toDomain)
  }

  async findById(id: string): Promise<Artist | null> {
    const { data, error } = await supabase.from('artists').select('*').eq('id', id).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch artist by id: ${error.message}`)
    }
    return data ? toDomain(data) : null
  }

  async findByName(name: string): Promise<Artist | null> {
    const { data, error } = await supabase.from('artists').select('*').ilike('name', name).maybeSingle()
    if (error) {
      throw new Error(`Failed to fetch artist by name: ${error.message}`)
    }
    return data ? toDomain(data) : null
  }

  async findByGenres(genres: string[]): Promise<Artist[]> {
    const { data, error } = await supabase.from('artists').select('*').contains('genres', genres)
    if (error) {
      throw new Error(`Failed to fetch artists by genres: ${error.message}`)
    }
    return (data ?? []).map(toDomain)
  }

  async create(dto: CreateArtistDTO): Promise<Artist> {
    const payload = {
      name: dto.name,
      bio: dto.bio ?? null,
      country: dto.country ?? null,
      foundedYear: dto.foundedYear ?? null,
      imageUrl: dto.imageUrl ?? null,
      genres: dto.genres,
      verified: false,
      socialLinks: dto.socialLinks ?? null,
    }

    const { data, error } = await supabase.from('artists').insert(payload).select().single()
    if (error) {
      throw new Error(`Failed to create artist: ${error.message}`)
    }
    return toDomain(data)
  }

  async update(id: string, dto: UpdateArtistDTO): Promise<Artist | null> {
    const payload = {
      ...dto,
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('artists').update(payload).eq('id', id).select().maybeSingle()
    if (error) {
      throw new Error(`Failed to update artist: ${error.message}`)
    }
    return data ? toDomain(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('artists').delete().eq('id', id)
    return !error
  }

  async verify(id: string): Promise<boolean> {
    const { error } = await supabase.from('artists').update({ verified: true }).eq('id', id)
    return !error
  }

  async search(query: string): Promise<Artist[]> {
    const term = `%${query.trim()}%`
    const [nameResult, bioResult] = await Promise.all([
      supabase.from('artists').select('*').ilike('name', term).limit(20),
      supabase.from('artists').select('*').ilike('bio', term).limit(20),
    ])

    if (nameResult.error) {
      throw new Error(`Failed to search artists by name: ${nameResult.error.message}`)
    }

    if (bioResult.error) {
      throw new Error(`Failed to search artists by bio: ${bioResult.error.message}`)
    }

    const merged = [...(nameResult.data ?? []), ...(bioResult.data ?? [])]
    const uniqueById = new Map(merged.map((artist) => [artist.id, artist]))
    return Array.from(uniqueById.values()).map(toDomain).slice(0, 20)
  }
}
