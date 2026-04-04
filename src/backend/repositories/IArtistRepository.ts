import { Artist, CreateArtistDTO, UpdateArtistDTO } from '../models/Artist';

export interface IArtistRepository {
  findAll(): Promise<Artist[]>;
  
  findById(id: string): Promise<Artist | null>;
  
  findByName(name: string): Promise<Artist | null>;
  
  findByGenres(genres: string[]): Promise<Artist[]>;
  
  create(dto: CreateArtistDTO): Promise<Artist>;
  
  update(id: string, dto: UpdateArtistDTO): Promise<Artist | null>;
  
  delete(id: string): Promise<boolean>;
  
  verify(id: string): Promise<boolean>;
  
  search(query: string): Promise<Artist[]>;
}
