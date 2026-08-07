import { describe, expect, it } from 'vitest';
import { loadConsolidatedArtistRows } from '@/lib/catalog/seedConsolidatedArtists';
import { resolve } from 'path';

describe('loadConsolidatedArtistRows', () => {
  it('parses the project CSV with Artist Name and Spotify Artist ID headers', () => {
    const path = resolve(process.cwd(), 'doc/consolidated_darkcharts_artists.csv');
    const rows = loadConsolidatedArtistRows(path);
    expect(rows.length).toBeGreaterThan(10);
    expect(rows[0].name).toBeTruthy();
    expect(rows.some((r) => r.spotifyId)).toBe(true);
    expect(rows.some((r) => r.subgenres.length > 0)).toBe(true);
  });
});
