import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock prisma before importing handler
vi.mock('../../src/backend/lib/prisma', () => ({
  prisma: {
    chartEntry: {
      findMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import handler, { isoWeekToMonday, getCurrentWeekMonday } from './history';
import { prisma } from '../../src/backend/lib/prisma';

// ---- helpers ----

function makeReq(method: string, query: Record<string, string> = {}): VercelRequest {
  return { method, query, headers: {}, url: '/api/charts/history' } as unknown as VercelRequest;
}

function makeRes() {
  const res = {
    _statusCode: 0 as number,
    _body: undefined as unknown,
    status(code: number) {
      this._statusCode = code;
      return this;
    },
    json(body: unknown) {
      this._body = body;
      return this;
    },
    end() {
      return this;
    },
  };
  vi.spyOn(res, 'status');
  vi.spyOn(res, 'json');
  vi.spyOn(res, 'end');
  return res as unknown as VercelResponse & { _statusCode: number; _body: unknown };
}

const mockPrisma = prisma as { chartEntry: { findMany: ReturnType<typeof vi.fn> } };

// Wednesday 2025-04-09 — current ISO week = 15, current Monday = 2025-04-07
const FIXED_NOW = new Date('2025-04-09T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  mockPrisma.chartEntry.findMany.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ---- Pure helper unit tests ----

describe('isoWeekToMonday', () => {
  it('week 1 of 2025 starts on 2024-12-30', () => {
    const d = isoWeekToMonday(2025, 1);
    expect(d.toISOString().startsWith('2024-12-30')).toBe(true);
  });

  it('week 14 of 2025 starts on 2025-03-31', () => {
    const d = isoWeekToMonday(2025, 14);
    expect(d.toISOString().startsWith('2025-03-31')).toBe(true);
  });

  it('week 1 of 2026 starts on 2025-12-29', () => {
    const d = isoWeekToMonday(2026, 1);
    expect(d.toISOString().startsWith('2025-12-29')).toBe(true);
  });
});

describe('getCurrentWeekMonday', () => {
  it('returns the Monday of the current ISO week', () => {
    // System time is 2025-04-09 (Wednesday) → Monday is 2025-04-07
    const d = getCurrentWeekMonday();
    expect(d.toISOString().startsWith('2025-04-07')).toBe(true);
  });
});

// ---- Handler tests ----

describe('GET /api/charts/history', () => {
  // --- Method guard ---

  describe('method guard', () => {
    it('returns 200 for OPTIONS (preflight)', async () => {
      const req = makeReq('OPTIONS');
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 405 for POST', async () => {
      const req = makeReq('POST', { year: '2025', week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 405 for PUT', async () => {
      const req = makeReq('PUT', { year: '2025', week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  // --- Missing params ---

  describe('missing parameters', () => {
    it('returns 400 when year is missing', async () => {
      const req = makeReq('GET', { week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when week is missing', async () => {
      const req = makeReq('GET', { year: '2025' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when both year and week are missing', async () => {
      const req = makeReq('GET', {});
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // --- Invalid schema values ---

  describe('invalid parameter values', () => {
    it('returns 400 when year is a non-numeric string', async () => {
      const req = makeReq('GET', { year: 'abc', week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when week is 0', async () => {
      const req = makeReq('GET', { year: '2025', week: '0' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when week is 54', async () => {
      const req = makeReq('GET', { year: '2025', week: '54' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when year is 1999 (below minimum 2020)', async () => {
      const req = makeReq('GET', { year: '1999', week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when year is 2100 (above maximum 2099)', async () => {
      const req = makeReq('GET', { year: '2100', week: '10' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // --- Business logic validation ---

  describe('business logic validation', () => {
    it('returns 400 with "Cannot access currently running week" for the current Monday (week 15 of 2025)', async () => {
      // Current week = week 15 (Monday 2025-04-07)
      const req = makeReq('GET', { year: '2025', week: '15' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect((res._body as { error: string }).error).toBe('Cannot access currently running week');
    });

    it('returns 400 with "Cannot access future week" for a week in the future', async () => {
      const req = makeReq('GET', { year: '2025', week: '20' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect((res._body as { error: string }).error).toBe('Cannot access future week');
    });

    it('returns 400 for a future year', async () => {
      const req = makeReq('GET', { year: '2026', week: '1' });
      const res = makeRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // --- Success ---

  describe('success', () => {
    it('returns 200 with sorted entries for a valid past week', async () => {
      const mockEntries = [
        {
          id: 'e1',
          placement: 1,
          score: 90,
          communityPower: 70,
          movement: 2,
          chartType: 'combined',
          weekStart: new Date('2025-03-31T00:00:00.000Z'),
          createdAt: new Date('2025-04-01T00:00:00.000Z'),
          release: {
            id: 'r1',
            title: 'Dark Song',
            releaseType: 'single',
            releaseDate: new Date('2025-01-01'),
            spotifyId: 'sp1',
            odesliLinks: null,
            itunesArtworkUrl: null,
            vercelBlobUrl: null,
            artist: {
              id: 'a1',
              name: 'Gothic Band',
              spotifyId: null,
              genres: ['Gothic Rock'],
              bio: null,
              profileLink: null,
              imageUrl: null,
            },
          },
        },
      ];
      mockPrisma.chartEntry.findMany.mockResolvedValue(mockEntries);

      const req = makeReq('GET', { year: '2025', week: '14' });
      const res = makeRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res._body as { success: boolean; year: number; week: number; weekStart: string; entries: unknown[]; count: number };
      expect(body.success).toBe(true);
      expect(body.year).toBe(2025);
      expect(body.week).toBe(14);
      expect(body.weekStart).toBe('2025-03-31T00:00:00.000Z');
      expect(body.count).toBe(1);
      expect(body.entries).toHaveLength(1);
    });

    it('returns 200 with empty entries when no data found for that week', async () => {
      mockPrisma.chartEntry.findMany.mockResolvedValue([]);

      const req = makeReq('GET', { year: '2025', week: '14' });
      const res = makeRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res._body as { entries: unknown[]; count: number };
      expect(body.entries).toHaveLength(0);
      expect(body.count).toBe(0);
    });

    it('passes the correct Monday weekStart to prisma.findMany', async () => {
      const req = makeReq('GET', { year: '2025', week: '14' });
      const res = makeRes();
      await handler(req, res);

      expect(mockPrisma.chartEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            weekStart: isoWeekToMonday(2025, 14),
          }),
          orderBy: { placement: 'asc' },
          include: {
            release: {
              include: { artist: true },
            },
          },
        })
      );
    });
  });
});
