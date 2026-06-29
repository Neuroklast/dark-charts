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