import { describe, expect, it } from 'vitest';
import { upgradeArtworkUrl, pickArtworkUrl, extractItunesArtistId } from './itunesApi';

describe('itunesApi', () => {
  it('upgrades artwork to 3000x3000', () => {
    expect(upgradeArtworkUrl('https://is1-ssl.mzstatic.com/x/100x100bb.jpg')).toBe(
      'https://is1-ssl.mzstatic.com/x/3000x3000bb.jpg'
    );
  });

  it('picks highest resolution artwork', () => {
    expect(
      pickArtworkUrl({
        artworkUrl100: 'https://example.com/100x100bb.jpg',
        artworkUrl600: 'https://example.com/600x600bb.jpg',
      })
    ).toBe('https://example.com/3000x3000bb.jpg');
  });

  it('extracts iTunes artist id from Apple Music URL', () => {
    expect(
      extractItunesArtistId('https://music.apple.com/de/artist/lacrimosa/123456789')
    ).toBe('123456789');
  });
});