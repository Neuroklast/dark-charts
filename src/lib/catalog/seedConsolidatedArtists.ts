/**
 * Seed artists from consolidated_darkcharts_artists.csv into Supabase.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { AppSupabaseClient } from '@/types/supabase-client';
import { enqueueArtistSyncJobs } from '@/lib/api/syncQueue';

export interface SeedArtistsResult {
  created: number;
  updated: number;
  skipped: number;
  syncJobsQueued: number;
  errors: string[];
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function loadConsolidatedArtistRows(
  csvPath?: string
): Array<{
  name: string;
  mainGenre: string;
  subgenres: string[];
  label: string | null;
  spotifyId: string | null;
  country: string | null;
}> {
  const path =
    csvPath ??
    resolve(process.cwd(), 'doc/consolidated_darkcharts_artists.csv');

  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    const fallback = resolve(process.cwd(), 'consolidated_darkcharts_artists.csv');
    raw = readFileSync(fallback, 'utf8');
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/['"]/g, '').trim()
  );
  const nameIdx = headers.findIndex(
    (h) =>
      h === 'name' ||
      h === 'artist' ||
      h === 'artist_name' ||
      h === 'artist name'
  );
  const genreIdx = headers.findIndex(
    (h) => h === 'maingenre' || h === 'main_genre' || h === 'genre'
  );
  const subIdx = headers.findIndex(
    (h) => h === 'subgenres' || h === 'subgenre' || h === 'sub_genres'
  );
  const labelIdx = headers.findIndex((h) => h === 'label');
  const spotifyIdx = headers.findIndex(
    (h) =>
      h === 'spotifyid' ||
      h === 'spotify_id' ||
      h === 'spotify' ||
      h === 'spotify artist id'
  );
  const countryIdx = headers.findIndex((h) => h === 'country');

  if (nameIdx < 0) {
    throw new Error('CSV missing name/artist column');
  }

  const rows: Array<{
    name: string;
    mainGenre: string;
    subgenres: string[];
    label: string | null;
    spotifyId: string | null;
    country: string | null;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const name = cells[nameIdx]?.trim();
    if (!name) continue;

    const mainGenre = (genreIdx >= 0 ? cells[genreIdx] : '') || '';
    const subRaw = subIdx >= 0 ? cells[subIdx] : '';
    let subgenres: string[] = [];
    if (subRaw) {
      try {
        const parsed = JSON.parse(subRaw.replace(/""/g, '"'));
        if (Array.isArray(parsed)) {
          subgenres = parsed.map(String).filter(Boolean);
        }
      } catch {
        subgenres = subRaw
          .split(/[|;,/]/)
          .map((s) => s.trim().replace(/^\[|\]$/g, '').replace(/^"|"$/g, ''))
          .filter(Boolean);
      }
    }
    if (subgenres.length === 0 && mainGenre) {
      subgenres = [mainGenre];
    }

    const spotifyRaw = spotifyIdx >= 0 ? cells[spotifyIdx]?.trim() : '';
    let spotifyId: string | null = null;
    if (spotifyRaw) {
      const match = spotifyRaw.match(/artist\/([a-zA-Z0-9]+)/);
      spotifyId = match?.[1] ?? (spotifyRaw.length < 40 ? spotifyRaw : null);
    }

    rows.push({
      name,
      mainGenre,
      subgenres,
      label: labelIdx >= 0 ? cells[labelIdx]?.trim() || null : null,
      spotifyId,
      country: countryIdx >= 0 ? cells[countryIdx]?.trim() || null : null,
    });
  }

  return rows;
}

export async function seedConsolidatedArtists(
  db: AppSupabaseClient,
  options: { enqueueSync?: boolean; csvPath?: string } = {}
): Promise<SeedArtistsResult> {
  const result: SeedArtistsResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    syncJobsQueued: 0,
    errors: [],
  };

  const rows = loadConsolidatedArtistRows(options.csvPath);
  const touchedIds: string[] = [];

  for (const row of rows) {
    try {
      let existingId: string | null = null;

      if (row.spotifyId) {
        const { data } = await db
          .from('artists')
          .select('id')
          .eq('spotifyId', row.spotifyId)
          .maybeSingle();
        existingId = data?.id ?? null;
      }

      if (!existingId) {
        const { data } = await db
          .from('artists')
          .select('id, source')
          .ilike('name', row.name)
          .limit(1)
          .maybeSingle();
        // Prefer not overwriting darktunes-imported artists with CSV-only data
        if (data?.source === 'darktunes-import') {
          existingId = data.id;
          result.skipped++;
          touchedIds.push(data.id);
          continue;
        }
        existingId = data?.id ?? null;
      }

      const genres =
        row.subgenres.length > 0
          ? row.subgenres
          : row.mainGenre
            ? [row.mainGenre]
            : [];

      const payload = {
        name: row.name,
        spotifyId: row.spotifyId,
        genres,
        country: row.country,
        socialLinks: row.label ? { label: row.label } : null,
        isVisible: true,
        source: 'csv-seed',
        updatedAt: new Date().toISOString(),
      };

      if (existingId) {
        const { error } = await db.from('artists').update(payload).eq('id', existingId);
        if (error) {
          result.errors.push(`${row.name}: ${error.message}`);
          continue;
        }
        result.updated++;
        touchedIds.push(existingId);
      } else {
        const { data: created, error } = await db
          .from('artists')
          .insert(payload)
          .select('id')
          .single();
        if (error || !created) {
          result.errors.push(`${row.name}: ${error?.message ?? 'insert failed'}`);
          continue;
        }
        result.created++;
        touchedIds.push(created.id);
      }
    } catch (err) {
      result.errors.push(
        `${row.name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (options.enqueueSync !== false && touchedIds.length > 0) {
    result.syncJobsQueued = await enqueueArtistSyncJobs(db, touchedIds, 'full');
  }

  return result;
}
