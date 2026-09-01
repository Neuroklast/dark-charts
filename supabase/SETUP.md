# Supabase Database Setup

This guide explains how to set up the Dark Charts database schema in Supabase.

> **Schema conventions and normalisation requirements** are documented in [`supabase/DB_REQUIREMENTS.md`](./DB_REQUIREMENTS.md). Read it before making any schema changes.

## Prerequisites

Before applying the schema, ensure you can run SQL in the **Supabase Dashboard → SQL Editor** (requires a superuser/owner-provided connection for some grants on PostgreSQL 15+). If you hit `permission denied for schema public`, run the standard platform grants first in the SQL Editor:

```sql
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE, CREATE ON SCHEMA public TO authenticated, anon, service_role;
```

## Fresh install (new project / empty DB)

1. **Bootstrap**: paste the entire contents of `supabase/reset.sql` into Supabase Dashboard → SQL Editor → **Run**.
2. `reset.sql` is fully idempotent — re-running is safe (tables `IF NOT EXISTS`, columns `ADD COLUMN IF NOT EXISTS`, `DROP POLICY/TRIGGER IF EXISTS` + recreate).

## Existing database (already bootstrapped)

Apply incremental migrations in order under `supabase/migrations/` — each file is `YYYYMMDD_<slug>.sql`. Run each in the SQL Editor (or via a migration runner) top-to-bottom:

```bash
# examples (names from the current tree)
supabase/migrations/20260629_spotlight_stripe_columns.sql
supabase/migrations/20260630_admin_settings_extensions.sql
supabase/migrations/20260630_supabase_auth_migration.sql
supabase/migrations/20260807_durable_sync_queue.sql
```

> Migrations assume the bootstrap is present. Do **not** run them against a blank DB, and do not re-run `reset.sql` on a DB that has already been migrated (it is the fresh-install source of truth; on an existing DB use migrations only).

## Auth

- Enable **Email** auth in Supabase Auth.
- Set **Site URL** + **Redirect URLs** to `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` / `https://<your-domain>`).
- Google OAuth is optional (see `GOOGLE_CLIENT_*` env).

## Troubleshooting

### Error: "permission denied for schema public"

**Solution:** Run the manual grants (Prerequisites) first.

### Error: "relation does not exist"

**Solution:** Ensure you're running the complete `reset.sql` (fresh install) or the correct ordered migrations (existing DB) — not a partial snippet.

### Error: "syntax error at or near NOT"

**Solution:** Your Supabase instance may not support `CREATE TYPE IF NOT EXISTS`; `reset.sql` uses `DO $$ ... EXCEPTION WHEN duplicate_object` blocks to avoid this.
