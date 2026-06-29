import { describe, it, expect } from 'vitest';
import { buildGenreChartInserts } from './genre-aggregation';

describe('genre-aggregation', () => {
  it('creates genre chart entries when vote threshold is met', () => {
    const inserts = buildGenreChartInserts({
      combinedScores: [
        {
          releaseId: 'r1',
          fanScore: 2000,
          expertScore: 10,
          streamingScore: 50,
          weightedScore: 0.8,
          communityPower: 40,
        },
        {
          releaseId: 'r2',
          fanScore: 1000,
          expertScore: 5,
          streamingScore: 20,
          weightedScore: 0.4,
          communityPower: 20,
        },
      ],
      releaseGenreMap: new Map([
        ['r1', { releaseGenres: ['Gothic Rock'], artistGenres: [] }],
        ['r2', { releaseGenres: ['Doom Metal'], artistGenres: [] }],
      ]),
      fanVoteCountByRelease: new Map([
        ['r1', 6],
        ['r2', 2],
      ]),
      weekStartIso: '2026-06-23T00:00:00.000Z',
      weekNumber: 26,
      year: 2026,
    });

    const gothicFan = inserts.filter(
      (entry) => entry.genre === 'Gothic Rock' && entry.chartType === 'fan'
    );
    const doomFan = inserts.filter(
      (entry) => entry.genre === 'Doom Metal' && entry.chartType === 'fan'
    );

    expect(gothicFan).toHaveLength(1);
    expect(gothicFan[0].releaseId).toBe('r1');
    expect(doomFan).toHaveLength(0);
  });
});