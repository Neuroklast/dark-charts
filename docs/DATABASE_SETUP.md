# Dark Charts database deployment

## Environment

- **Supabase project:** [Darktunes Charts](https://supabase.com/dashboard/project/gzjpsjthefabbipixizt) (`gzjpsjthefabbipixizt`)
- **Organization/plan:** `neuroklast's projects` / Free (separate from the Neuroklast Pro organization)
- **Region:** `eu-central-1` (Frankfurt)
- **Schema source:** `supabase/reset.sql`
- **Schema applied:** `dark_charts_initial_schema`, `dark_charts_secure_functions_and_indexes`
- **Vercel project:** `dark-charts` / `prj_v9E01YmizXtQX0N8mk4ftaRIoIfO`

The initial schema has been applied to the new, initially empty database. No
existing database was overwritten and no catalog/users were migrated.

## Security and integrity

- RLS is enabled on all 25 application tables.
- Public SELECT is restricted to the explicitly public artist, release,
  chart and badge data. Other tables intentionally have no public policies.
- `cast_weekly_ballot` and `reserve_spotlight_slot` are service-only RPCs.
- `handle_new_auth_user` and `rls_auto_enable` are not callable by API users.
- Spotlight active slots are protected by a partial unique index.
- Never commit API credentials or paste secret/service-role keys into a PR.

## Vercel status and safe cutover

The **development** Vercel environment has the new project's URL and
publishable key:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The **production and preview** environment variables have not been changed.
They still reference the existing database. The Vercel API did not accept
branch-scoped Preview variables at the time of setup, even after the new
branch deployed; it reported that the branch was not found.

To finish connecting the new database securely:

1. In the [Supabase dashboard](https://supabase.com/dashboard/project/gzjpsjthefabbipixizt/settings/api-keys), obtain the **new project's server-side secret/service-role key**. Do not post it in a chat or commit it.
2. In [Vercel project settings](https://vercel.com/neuroklasts-projects/dark-charts/settings/environment-variables), set `SUPABASE_SERVICE_ROLE_KEY` as **encrypted/sensitive** for the intended environment. It must be from this project, not another Supabase database. Do not use the service key in any `NEXT_PUBLIC_` variable.
3. Set the two public Supabase variables for that same environment. Prefer branch-scoped Preview when Vercel recognizes the Git branch.
4. Deploy an isolated preview, confirm login, onboarding, CRUD, voting transaction, checkout in **Stripe test mode**, cron authorization and chart queries.
5. Before changing production, decide whether users/releases from the prior database must be migrated. The new database is intentionally empty. Back up and validate migrated content if needed.
6. Only after successful tests, update production's three Supabase variables together and redeploy. Ensure OAuth callback URLs, auth email templates and allowed origins refer to the final domain. Keep old DB backups for rollback.

The Vercel Next.js preview build of this branch is **READY**, but a successful
build does **not** prove database connectivity, functional tests, or payment
readiness.

## Free-tier caveat

Supabase Free projects can be paused after prolonged inactivity and have
smaller compute/usage quotas. Avoid treating this as a high-availability
production database until the traffic and availability requirements are met.
