import { describe, expect, it } from 'vitest';
import { parseArtistCsv } from '@/lib/catalog/artistCsv';

describe('parseArtistCsv', () => {
  it('accepts name-only uploads and optional metadata', () => {
    expect(parseArtistCsv('Name,Spotify_ID,Genres,Country\nNeuroklast,,Hard Techno|Industrial Techno,Germany').artists)
      .toEqual([{
        name: 'Neuroklast',
        spotifyId: null,
        genres: ['Hard Techno', 'Industrial Techno'],
        country: 'Germany',
      }]);
  });

  it('handles Excel semicolon CSV, BOM, quoted delimiters and multiline fields', () => {
    const input = '\uFEFFArtist;Spotify URL;Genre;Land\r\n"Alpha; Beta";;"Dark Wave|Post Punk";DE\r\n"Gamma\nDelta";;;';
    const result = parseArtistCsv(input);
    expect(result.artists).toHaveLength(2);
    expect(result.artists[0].name).toBe('Alpha; Beta');
    expect(result.artists[1].name).toBe('Gamma\nDelta');
  });

  it('skips duplicate artists without losing valid rows', () => {
    const result = parseArtistCsv('Artist\nBand A\nband a\nBand B\n');
    expect(result.artists.map(a => a.name)).toEqual(['Band A', 'Band B']);
    expect(result.duplicateCount).toBe(1);
  });

  it('rejects missing name column and invalid Spotify IDs', () => {
    expect(() => parseArtistCsv('Foo\nBand')).toThrow('Spalte Name');
    const result = parseArtistCsv('Name,Spotify_ID\nValid,\nBad,wrong');
    expect(result.artists).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it('handles escaped double quotes in quoted names', () => {
    const result = parseArtistCsv('Artist,Country\n"The ""Band"", Inc.",DE');
    expect(result.artists[0].name).toBe('The "Band", Inc.');
  });
});
