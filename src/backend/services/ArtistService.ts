import { IArtistRepository } from '../repositories/IArtistRepository';
import { Artist, CreateArtistDTO, UpdateArtistDTO } from '../models/Artist';

export class ArtistService {
  constructor(private artistRepository: IArtistRepository) {}

  async getAllArtists(): Promise<Artist[]> {
    return this.artistRepository.findAll();
  }

  async getArtistById(id: string): Promise<Artist | null> {
    if (!id || id.trim() === '') {
      throw new Error('Artist ID is required');
    }
    return this.artistRepository.findById(id);
  }

  async getArtistByName(name: string): Promise<Artist | null> {
    if (!name || name.trim() === '') {
      throw new Error('Artist name is required');
    }
    return this.artistRepository.findByName(name);
  }

  async getArtistsByGenres(genres: string[]): Promise<Artist[]> {
    if (!genres || genres.length === 0) {
      throw new Error('At least one genre is required');
    }
    return this.artistRepository.findByGenres(genres);
  }

  async createArtist(dto: CreateArtistDTO): Promise<Artist> {
    this.validateCreateArtistDTO(dto);

    const existing = await this.artistRepository.findByName(dto.name);
    if (existing) {
      throw new Error(`Artist with name "${dto.name}" already exists`);
    }

    return this.artistRepository.create(dto);
  }

  async updateArtist(id: string, dto: UpdateArtistDTO): Promise<Artist | null> {
    if (!id || id.trim() === '') {
      throw new Error('Artist ID is required');
    }

    const existing = await this.artistRepository.findById(id);
    if (!existing) {
      return null;
    }

    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.artistRepository.findByName(dto.name);
      if (nameConflict && nameConflict.id !== id) {
        throw new Error(`Artist with name "${dto.name}" already exists`);
      }
    }

    return this.artistRepository.update(id, dto);
  }

  async deleteArtist(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Artist ID is required');
    }

    const existing = await this.artistRepository.findById(id);
    if (!existing) {
      return false;
    }

    return this.artistRepository.delete(id);
  }

  async verifyArtist(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Artist ID is required');
    }

    const existing = await this.artistRepository.findById(id);
    if (!existing) {
      throw new Error(`Artist with ID "${id}" not found`);
    }

    return this.artistRepository.verify(id);
  }

  async searchArtists(query: string): Promise<Artist[]> {
    if (!query || query.trim() === '') {
      return this.artistRepository.findAll();
    }

    return this.artistRepository.search(query.trim());
  }

  private validateCreateArtistDTO(dto: CreateArtistDTO): void {
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Artist name is required');
    }

    if (!dto.genres || dto.genres.length === 0) {
      throw new Error('At least one genre is required');
    }

    if (dto.foundedYear && (dto.foundedYear < 1900 || dto.foundedYear > new Date().getFullYear())) {
      throw new Error('Invalid founded year');
    }
  }
}
