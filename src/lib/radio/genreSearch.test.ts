import { describe, expect, it } from 'vitest';
import { matchesRadioGenre, normalizeGenre } from './genreSearch';

describe('radio genre search', () => {
  it('normalizes spaces, punctuation and case', () => {
    expect(normalizeGenre('DARK-Wave')).toBe('darkwave');
    expect(matchesRadioGenre(['Dark Wave', 'Gothic Rock'], 'darkwave')).toBe(true);
    expect(matchesRadioGenre(['darkwave'], 'Dark Wave')).toBe(true);
  });
  it('uses explicit track genres rather than the broadcaster genre', () => {
    expect(matchesRadioGenre(['Gothic Rock'], 'Darkwave')).toBe(false);
    expect(matchesRadioGenre(['Dark Techno'], '')).toBe(true);
  });
});
