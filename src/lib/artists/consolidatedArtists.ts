import type { Genre, MainGenre } from '@/types';

// Legacy in-memory fallback used only when the durable Supabase sync is unavailable.
// No static catalog is shipped or silently imported. Real artists are entered in
// the admin UI or uploaded by an administrator and synchronized through Supabase.
export interface ConsolidatedArtist {
  id: string;
  name: string;
  mainGenre: MainGenre;
  subgenres: Genre[];
  label: string | null;
}

type ArtistRegistry = typeof globalThis & {
  __darkChartsImportedArtists?: Map<string, ConsolidatedArtist>;
};

function registry(): Map<string, ConsolidatedArtist> {
  const g = globalThis as ArtistRegistry;
  return g.__darkChartsImportedArtists ??= new Map<string, ConsolidatedArtist>();
}

export function registerImportedArtists(artists: readonly ConsolidatedArtist[]): number {
  for (const artist of artists) {
    if (!artist.id.trim() || !artist.name.trim()) continue;
    registry().set(artist.id, { ...artist, subgenres: [...artist.subgenres] });
  }
  return registry().size;
}

export function loadConsolidatedArtists(): ConsolidatedArtist[] {
  return [...registry().values()];
}

export function getConsolidatedArtistById(id: string): ConsolidatedArtist | null {
  return registry().get(id) ?? null;
}
