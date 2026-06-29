# Data & Schema

## Single source of truth

- SQL: `supabase/reset.sql`
- Types: `src/types/database.ts`

No files in `supabase/migrations/`.

## Supabase clients

- Browser: `src/lib/supabase/client.ts` (anon key)
- Server API: `createServiceRoleSupabaseClient()` in `src/lib/supabase/server.ts`

## R2 artwork

1. Download external image during sync
2. `uploadUrlToR2()` → `src/lib/r2Utils.ts`
3. Store URL in `releases.r2ArtworkUrl`
4. Fallback to external URL on failure

## DAL pattern

```typescript
export async function getChartEntries(supabase: AppSupabaseClient, ...) { ... }
```

Pass `AppSupabaseClient` as first argument.