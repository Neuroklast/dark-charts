# Integration Summary

## Implemented

| Area | Status |
|------|--------|
| Next.js 16 App Router | Done — `app/` with URL routes |
| API Route Handlers | Done — `app/api/` (22 routes) |
| Supabase schema | Done — `supabase/reset.sql` + `database.ts` |
| Supabase server client | Done — service role for API |
| R2 utilities | Done — `src/lib/r2Utils.ts` |
| Image proxy | Done — `src/lib/imageUtils.ts` |
| Voting pause persistence | Done — `system_settings` table |
| Lenis smooth scroll | Done — `LenisProvider` |
| Google OAuth server exchange | Done — `/api/auth/oauth/google` |

## Pending (manual setup)

| Area | Action |
|------|--------|
| Supabase cloud | Run `supabase/reset.sql` in SQL Editor |
| Env vars | Copy `.env.example` → `.env.local`, fill values |
| Cloudflare R2 | Create bucket, set `R2_*` env vars |
| Spotify | Dashboard credentials for server + `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` |

## Legacy (deprecated)

- `api/` — Vercel serverless (replaced by `app/api/`)
- `vite.config.ts` / `src/main.tsx` — Vite SPA entry (replaced by Next.js)
- `prisma/` — removed after Supabase migration