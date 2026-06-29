import { readFileSync } from 'fs';
import { join } from 'path';
import { Genre, MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';

export interface ConsolidatedArtist {
  id: string;
  name: string;
  spotifyArtistId: string | null;
  mainGenre: MainGenre;
  subgenres: Genre[];
  country: string | null;
  label: string | null;
}

const CSV_PATH = join(process.cwd(), 'doc', 'consolidated_darkcharts_artists.csv');

let cachedArtists: ConsolidatedArtist[] | null = null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseSubgenres(raw: string): Genre[] {
  if (!raw?.trim()) return [];
  try {
    const normalized = raw.replace(/""/g, '"');
    const parsed = JSON.parse(normalized) as string[];
    return parsed.filter((g): g is Genre => typeof g === 'string' && g.length > 0);
  } catch {
    return raw
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => s.replace(/"/g, '').trim())
      .filter(Boolean) as Genre[];
  }
}

function resolveMainGenre(value: string): MainGenre {
  const normalized = value.trim() as MainGenre;
  if (normalized in mainGenreMap) return normalized;
  return 'Crossover';
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  fields.push(current);
  return fields;
}

export function loadConsolidatedArtists(): ConsolidatedArtist[] {
  if (cachedArtists) return cachedArtists;

  const raw = readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const dataLines = lines.slice(1);

  const artists: ConsolidatedArtist[] = [];

  for (const line of dataLines) {
    const fields = parseCsvLine(line);
    if (fields.length < 6) continue;

    const name = fields[0]?.trim();
    if (!name) continue;

    const spotifyArtistId = fields[4]?.trim() || null;
    const mainGenre = resolveMainGenre(fields[5] ?? 'Crossover');
    const subgenres = parseSubgenres(fields[6] ?? '');

    artists.push({
      id: spotifyArtistId ? `spotify:${spotifyArtistId}` : slugify(name),
      name,
      spotifyArtistId,
      mainGenre,
      subgenres,
      country: fields[2]?.trim() || null,
      label: fields[3]?.trim() || null,
    });
  }

  cachedArtists = artists;
  return artists;
}

export function getConsolidatedArtistById(artistId: string): ConsolidatedArtist | undefined {
  return loadConsolidatedArtists().find((a) => a.id === artistId);
}