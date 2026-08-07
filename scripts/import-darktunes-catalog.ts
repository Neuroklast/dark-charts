/**
 * Offline import of a darktunes catalog JSON export into dark-charts Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-darktunes-catalog.ts path/to/catalog.json
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Expected JSON shape:
 * {
 *   "artists": [{ "name", "spotifyId?", "itunesId?", "genres?", ... }],
 *   "releases": [{ "title", "releaseDate", "artistName" | "artistSpotifyId", ... }],
 *   "enqueueSync": true
 * }
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { importDarktunesCatalog } from '../src/lib/catalog/importDarktunes';

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: npx tsx scripts/import-darktunes-catalog.ts <catalog.json>');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const path = resolve(process.cwd(), fileArg);
  const payload = JSON.parse(readFileSync(path, 'utf8'));

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const result = await importDarktunesCatalog(db as any, {
    artists: payload.artists ?? [],
    releases: payload.releases ?? [],
    enqueueSync: payload.enqueueSync !== false,
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
