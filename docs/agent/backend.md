# Backend

## Route handlers

All under `app/api/`. Wrap with `withErrorHandler`.

## Admin auth

`requireAdmin()` / `withAdminAuth()` in `src/lib/adminAuth.ts` — JWT Bearer + DB role check.

## Voting

- `system_settings.isVotingPaused` persisted in Supabase
- Checked in `app/api/vote/route.ts` before processing

## Cron

Vercel cron → `GET /api/cron/aggregate-charts` with `Authorization: Bearer $CRON_SECRET`

## Health

`GET /api/health` — Supabase connectivity + env var checks