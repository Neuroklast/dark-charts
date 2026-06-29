import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertItunesReleases,
  buildItunesChartEntries,
  type ItunesSyncedRelease,
} from '@/lib/charts/itunesChartStore';

const sampleReleases: ItunesSyncedRelease[] = [
  {
    id: 'itunes:1',
    artistId: 'a1',
    artistName: 'Artist A',
    title: 'New Album',
    releaseDate: '2026-06-01',
    artworkUrl: 'https://example.com/a.jpg',
    collectionViewUrl: 'https://music.apple.com/a',
    itunesId: '1',
    genres: ['Dark Wave'],
    mainGenre: 'Gothic',
    releaseType: 'album',
    label: 'Label A',
    syncedAt: Date.now(),
  },
  {
    id: 'itunes:2',
    artistId: 'a2',
    artistName: 'Artist B',
    title: 'Older Single',
    releaseDate: '2025-01-01',
    artworkUrl: 'https://example.com/b.jpg',
    collectionViewUrl: 'https://music.apple.com/b',
    itunesId: '2',
    genres: ['Gothic Metal'],
    mainGenre: 'Metal',
    releaseType: 'single',
    label: 'Label B',
    syncedAt: Date.now(),
  },
];

describe('itunesChartStore', () => {
  beforeEach(() => {
    const g = globalThis as typeof globalThis & {
      __darkChartsItunesReleases?: Map<string, ItunesSyncedRelease>;
    };
    delete g.__darkChartsItunesReleases;
    upsertItunesReleases(sampleReleases);
  });

  it('builds fan chart with newest release first', () => {
    const entries = buildItunesChartEntries('fan', { limit: 10 });
    expect(entries[0]?.release?.title).toBe('New Album');
    expect(entries[0]?.placement).toBe(1);
  });

  it('builds combined hybrid chart entries', () => {
    const entries = buildItunesChartEntries('combined', { limit: 10 });
    expect(entries.length).toBe(2);
    expect(entries[0]?.chartType).toBe('combined');
  });
});