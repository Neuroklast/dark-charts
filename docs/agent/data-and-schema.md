# Data Layer & Schema

## Single source of truth

- SQL bootstrap: `supabase/reset.sql` (full, idempotent)
- Incremental SQL: `supabase/migrations/*.sql` (apply on existing DBs)
- Types: `src/types/database.ts` (mirror of the schema — keep in sync after every change)

Keep the three in sync. Schema change checklist: see [supabase/DB_REQUIREMENTS.md](../supabase/DB_REQUIREMENTS.md) and [supabase/SETUP.md](../supabase/SETUP.md).

## Supabase clients

- Browser: `src/lib/supabase/client.ts` (anon key); `isSupabaseConfigured()` in `src/lib/supabase/isConfigured.ts`
- Server API (RSC/handlers): `createServiceRoleSupabaseClient()` in `src/lib/supabase/server.ts`
- SSR: `src/lib/supabase/server-ssr.ts`
- Env validation: Zod in `src/lib/env.server.ts` / `src/lib/env.client.ts`

## DAL pattern

```typescript
export async function getChartEntries(supabase: AppSupabaseClient, ...) { ... }
```

Pass `AppSupabaseClient` as the first argument. `.single()` returning `PGRST116` → return `null`. `rowTo*` mappers convert snake_case → camelCase.

## Chart data

`chart_entries` (aggregated) serve public chart reads via `src/lib/api/charts.ts`. Voting/bulk writes go through `src/lib/api/fan-vote.ts` and `src/lib/api/votes.ts`. Vote anomalies/conflicts in `src/lib/vote-anomaly.ts`, `src/lib/vote-conflicts.ts`.

## Catalog sync (durable)

1. Enqueue: `POST /api/sync/queue` → `sync_queue` rows
2. Process: `POST /api/sync` (cron every 10m) → `syncArtist` → upsert `releases` + R2 covers
3. Logs: `sync_logs`
4. darktunes bootstrap: `POST /api/admin/import/darktunes` or `scripts/import-darktunes-catalog.ts`
5. Scene artists: `POST /api/admin/seed/artists` (CSV)

Sync imports: `src/lib/itunesApi.ts`, `src/lib/sync/itunesSyncProcessor.ts`, `OdesliAPIRepository.ts`, `SpotifyWebAPIRepository.ts`.

## R2 artwork

1. Download external image during sync
2. `uploadUrlToR2()` / `createSyncUploadFn()` → `src/lib/r2Utils.ts`
3. Store URL in `releases.r2ArtworkUrl`
4. Fallback to external URL on failure

## Genre taxonomy

SSOT: `src/lib/config/genres.ts` — four main genres (`Gothic`, `Metal`, `Dark Electro`, `Crossover`) each with an ordered list of subgenres. Niche windows / aggregation thresholds key off the subgenre level.

## Trust levels

`src/lib/trust-level.ts` — `TRUST_LEVEL_WEIGHTS`: unverified email `0.1`, verified `0.5`, OAuth (Spotify/Google) `1.0`, OAuth + listening history `1.25`. `trustLevelForProvider(provider, emailVerified)` derives the level.

## Env & secrets

- Server secrets in env only (never `NEXT_PUBLIC_`).
- External API credentials (Spotify, Stripe) AES-256-GCM encrypted in `api_credentials` (admin-only RLS); master key in env only.
