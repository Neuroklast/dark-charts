import { IArtistRepository } from './IArtistRepository';
import { Artist, CreateArtistDTO, UpdateArtistDTO } from '../models/Artist';

export class SparkKVArtistRepository implements IArtistRepository {
  private readonly ARTISTS_KEY = 'cms:artists';
  private readonly ARTIST_PREFIX = 'cms:artist:';

  async findAll(): Promise<Artist[]> {
    const artistsData = await window.spark.kv.get<Artist[]>(this.ARTISTS_KEY);
    return artistsData || [];
  }

  async findById(id: string): Promise<Artist | null> {
    const key = `${this.ARTIST_PREFIX}${id}`;
    const artist = await window.spark.kv.get<Artist>(key);
    return artist || null;
  }

  async findByName(name: string): Promise<Artist | null> {
    const all = await this.findAll();
    return all.find(a => a.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async findByGenres(genres: string[]): Promise<Artist[]> {
    const all = await this.findAll();
    return all.filter(artist => 
      artist.genres.some(g => genres.includes(g))
    );
  }

  async create(dto: CreateArtistDTO): Promise<Artist> {
    const id = this.generateId();
    const now = new Date();
    
    const artist: Artist = {
      id,
      name: dto.name,
      bio: dto.bio,
      country: dto.country,
      foundedYear: dto.foundedYear,
      imageUrl: dto.imageUrl,
      genres: dto.genres,
      verified: false,
      socialLinks: dto.socialLinks,
      createdAt: now,
      updatedAt: now
    };

    const key = `${this.ARTIST_PREFIX}${id}`;
    await window.spark.kv.set(key, artist);

    const all = await this.findAll();
    all.push(artist);
    await window.spark.kv.set(this.ARTISTS_KEY, all);

    return artist;
  }

  async update(id: string, dto: UpdateArtistDTO): Promise<Artist | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updated: Artist = {
      ...existing,
      ...dto,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };

    const key = `${this.ARTIST_PREFIX}${id}`;
    await window.spark.kv.set(key, updated);

    const all = await this.findAll();
    const index = all.findIndex(a => a.id === id);
    if (index >= 0) {
      all[index] = updated;
      await window.spark.kv.set(this.ARTISTS_KEY, all);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const key = `${this.ARTIST_PREFIX}${id}`;
    await window.spark.kv.delete(key);

    const all = await this.findAll();
    const filtered = all.filter(a => a.id !== id);
    await window.spark.kv.set(this.ARTISTS_KEY, filtered);

    return true;
  }

  async verify(id: string): Promise<boolean> {
    const artist = await this.findById(id);
    if (!artist) {
      return false;
    }

    await this.update(id, { verified: true });
    return true;
  }

  async search(query: string): Promise<Artist[]> {
    const all = await this.findAll();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(artist => 
      artist.name.toLowerCase().includes(lowerQuery) ||
      artist.bio?.toLowerCase().includes(lowerQuery) ||
      artist.genres.some(g => g.toLowerCase().includes(lowerQuery))
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
