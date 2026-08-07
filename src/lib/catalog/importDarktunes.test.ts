import { describe, expect, it, vi } from 'vitest';
import { importDarktunesCatalog } from '@/lib/catalog/importDarktunes';

describe('importDarktunesCatalog', () => {
  it('creates a new artist when none exists', async () => {
    const insertedArtists: Record<string, unknown>[] = [];

    const db = {
      from: vi.fn((table: string) => {
        if (table === 'artists') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: null, error: null })),
              })),
              ilike: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
            })),
            insert: vi.fn((payload: Record<string, unknown>) => {
              insertedArtists.push(payload);
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'new-artist-id' },
                    error: null,
                  })),
                })),
              };
            }),
            update: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
          };
        }
        if (table === 'sync_queue') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                in: vi.fn(() => ({
                  in: vi.fn(async () => ({ data: [], error: null })),
                })),
              })),
            })),
            insert: vi.fn(async () => ({ error: null })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })),
          })),
        };
      }),
    } as any;

    const result = await importDarktunesCatalog(db, {
      artists: [{ name: 'Night Choir', spotifyId: 'abc', genres: ['Gothic'] }],
      releases: [],
      enqueueSync: true,
    });

    expect(result.artistsCreated).toBe(1);
    expect(result.errors).toEqual([]);
    expect(insertedArtists[0]).toMatchObject({
      name: 'Night Choir',
      spotifyId: 'abc',
      source: 'darktunes-import',
    });
    expect(result.syncJobsQueued).toBe(1);
  });
});
