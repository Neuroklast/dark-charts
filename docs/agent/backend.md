# Backend patterns

## API routes

- Location: `app/api/**/route.ts`
- Wrap handlers with `withErrorHandler` from `@/lib/errors`
- Auth: `requireAuth`, `requireVerifiedVoter`, `withAdminAuth` from `@/lib/api-auth` / `@/lib/adminAuth`
- DB: `createServiceRoleSupabaseClient()` — never expose service role to the client

## Services

- `src/backend/services/` — domain logic (Auth, Charts, Promotions, Badges)
- `src/lib/api/` — transactional helpers (e.g. fan vote bulk submit)

## Removed legacy

- Prisma, Vite SPA (`index.html`, `src/App.tsx`), `@vercel/node` auth-guard
- Old `api/` serverless folder — use App Router handlers only

## Cron

Protected by `CRON_SECRET` via `src/lib/cronAuth.ts`. Schedules in `vercel.json`.

| Path | Role |
|------|------|
| `/api/sync` | Drain durable `sync_queue` (iTunes → releases + R2) |
| `/api/sync/queue` | Enqueue all visible artists |
| `/api/cron/sync-itunes-artwork` | R2 cover backfill |
| `/api/cron/aggregate-charts` | Weekly chart aggregation |

Sync DAL: `src/lib/api/syncQueue.ts`, worker: `src/lib/sync/processSyncQueue.ts`, artist sync: `src/lib/sync/syncArtist.ts`.