# DARK CHARTS — Production database setup

## Architecture and hosting

- **Supabase:** [Darktunes Charts](https://supabase.com/dashboard/project/gzjpsjthefabbipixizt), ID `gzjpsjthefabbipixizt`
- **Plan:** Free; organization `neuroklast's projects`
- **Region:** Frankfurt (`eu-central-1`)
- **Vercel:** `dark-charts`, production project ID `prj_v9E01YmizXtQX0N8mk4ftaRIoIfO`
- **Public domain:** https://www.darkcharts.de
- **Deployment model:** **Production only** for this prototype; no preview or staging workflows required
- **Database schema source:** `supabase/reset.sql`

## Database provisioning

The existing initially empty Free database was provisioned using migrations:

1. `dark_charts_initial_schema`
2. `dark_charts_secure_functions_and_indexes`

All 25 application tables have RLS. Deliberately private tables have no
public access policies. The voting and reservation RPCs can be executed by the
Supabase service role only. Active Spotlight reservations have a unique index.

## Vercel Production variables

`NEXT_PUBLIC_SUPABASE_URL`:
`https://gzjpsjthefabbipixizt.supabase.co`

`NEXT_PUBLIC_SUPABASE_ANON_KEY`:
Use the **publishable** API key of the same Supabase project.

`SUPABASE_SERVICE_ROLE_KEY`:
Use the **server-side service-role** key of the same project. Sensitive, and
never prefixed with `NEXT_PUBLIC_`.

`JWT_SECRET`:
Generate a strong random secret (at least 32 characters) and keep it in the
**Production** environment only. Changing it invalidates existing legacy JWTs.

The above variables have been configured in Vercel Production as of
2026-10-28. Do not put secret values into GitHub issues, PRs or source code.

Optional Spotify and Cloudflare R2 integration variables may be left unset or
empty until those integrations are operational. Blank optional settings must
not prevent independent application routes from working.

## Production smoke checks

On 2026-10-28, production deployment `dpl_Emrs5mYsw6D6NWyMKGfyC7GbUc5h`
built successfully, and the public domain responded successfully to:

- `GET /api/spotlight/availability?slotType=BAND_OF_DAY` → 200
- `GET /api/spotlight/availability?slotType=DJ_OF_DAY` → 200
- Unauthenticated `GET /api/auth/me` → 401, expected

The database currently has no migrated user or artist catalog. Live payment,
authenticated sign-up, content imports and voting concurrency need functional
testing with legitimate test accounts before the prototype becomes a commercial
launch. A successful Vercel build alone is not comprehensive test coverage.

## Rollback and safety

For future schema changes, add versioned migrations and a backout plan. Avoid
running `supabase/reset.sql` over an existing populated production database
without reviewing any data-migration operations. Treat the Supabase Free
resource limits and automatic pausing policies as prototype constraints.
