import { describe, it, expect } from 'vitest';
import { loadConsolidatedArtists } from '@/lib/artists/consolidatedArtists';

describe('loadConsolidatedArtists', () => {
  it('loads artists from consolidated CSV', () => {
    const artists = loadConsolidatedArtists();
    expect(artists.length).toBeGreaterThan(100);
    expect(artists[0]?.name).toBeTruthy();
    expect(artists[0]?.mainGenre).toBeTruthy();
  });

  it('parses subgenres from CSV JSON-like field', () => {
    const artists = loadConsolidatedArtists();
    const monkey = artists.find((a) => a.name === '13th monkey');
    expect(monkey?.subgenres).toContain('Rhythmic Noise');
    expect(monkey?.mainGenre).toBe('Dark Electro');
  });
});