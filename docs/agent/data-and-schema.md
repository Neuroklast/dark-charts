# Data & Schema

## Single source of truth

- SQL: `supabase/reset.sql`
- Types: `src/types/database.ts`
- Incremental SQL: `supabase/migrations/*.sql` (apply on existing DBs; reset.sql remains full bootstrap)

## Supabase clients

- Browser: `src/lib/supabase/client.ts` (anon key)
- Server API: `createServiceRoleSupabaseClient()` in `src/lib/supabase/server.ts`

## Catalog sync (durable)

1. Enqueue: `POST /api/sync/queue` → `sync_queue` rows
2. Process: `POST /api/sync` (cron every 10m) → `syncArtist` → upsert `releases` + R2 covers
3. Logs: `sync_logs`
4. darktunes bootstrap: `POST /api/admin/import/darktunes` or `scripts/import-darktunes-catalog.ts`
5. Scene artists: `POST /api/admin/seed/artists` (CSV)

## R2 artwork

1. Download external image during sync
2. `uploadUrlToR2()` / `createSyncUploadFn()` → `src/lib/r2Utils.ts`
3. Store URL in `releases.r2ArtworkUrl`
4. Fallback to external URL on failure

## DAL pattern

```typescript
export async function getChartEntries(supabase: AppSupabaseClient, ...) { ... }
```

Pass `AppSupabaseClient` as first argument.
