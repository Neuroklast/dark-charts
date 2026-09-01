# Dark Charts Database Requirements

This document defines the **permanent, non-negotiable** structural requirements for the Dark Charts Supabase PostgreSQL database. Any developer or AI agent modifying the schema **must** verify compliance with all rules below.

---

## 1. Single Source of Truth

| Artefact | Purpose |
|---|---|
| `supabase/reset.sql` | Full idempotent schema bootstrap: table definitions, column additions, RLS policies, triggers, seed data, enums. |
| `supabase/migrations/*.sql` | Incremental SQL for **existing** databases (named `YYYYMMDD_<slug>.sql`). Apply in order. |
| `src/types/database.ts` | TypeScript mirror of the schema. Keep in sync after every change. |

- `reset.sql` is the **fresh-install** source of truth.
- An existing DB gets the bootstrap once, then **only** new migrations.
- A change that alters the schema lands in **both** places: the `CREATE TABLE` definition (or `ALTER … ADD COLUMN IF NOT EXISTS`) in `reset.sql` **and** a new migration file.

---

## 2. Normalisation & Referential Integrity

- Comply with 3NF: no redundant/derived columns that are derivable from other columns via a query; no transitive `PK → B → A` dependencies.
- Junction tables for many-to-many (e.g. `user_badges`, band↔release credits) — never array-of-IDs in a nullable/volatile column where FK integrity matters.
- FKs reference the correct table and cascade appropriately (`ON DELETE CASCADE` when the child is meaningless without the parent, `ON DELETE SET NULL` when it remains valid).

---

## 3. Idempotency Requirements

Every statement in `reset.sql` must be safe to run on a fresh database **and** an existing one:

| Object | Idempotent pattern |
|---|---|
| Tables | `CREATE TABLE IF NOT EXISTS` |
| Columns | `ALTER TABLE … ADD COLUMN IF NOT EXISTS` |
| Indexes | `CREATE INDEX IF NOT EXISTS` |
| Triggers | `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER` |
| Policies | `DROP POLICY IF EXISTS` then `CREATE POLICY` |
| Enum types | `DO $$ BEGIN CREATE TYPE … EXCEPTION WHEN duplicate_object … END $$` |
| Functions | `CREATE OR REPLACE FUNCTION` |

(New **migrations** may assume they run once in order on an existing DB, but keep them additive and non-breaking where possible.)

---

## 4. Row Level Security (RLS)

- **All tables must have RLS enabled** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`).
- Policies are named `"<table>: <actor> <action>"`, e.g. `"users: public read visible"`.
- Never bypass RLS from app code — use `SECURITY DEFINER` functions (`get_my_role()` / `has_permission()`) where direct recursion would otherwise occur.
- Public surfaces use column whitelists; secrets stay in admin-only tables.

---

## 5. Core tables

| Table | Purpose |
|---|---|
| `users` | Supabase-linked account + role (`FAN`/`DJ`/`BAND`/`LABEL`/`ADMIN`) |
| `artists`, `releases` | Catalog |
| `votes`, `expert_votes` | Fan + expert voting |
| `streaming_snapshots`, `user_listening_snapshots` | Streaming + loyalty input |
| `chart_entries` | Aggregated output for public chart reads |
| `vote_anomalies` | Aggregation anomaly detection |
| `fan_profiles`, `dj_profiles`, `band_profiles`, `label_profiles` | Role profiles |
| `sync_queue`, `sync_logs` | Durable catalog sync |
| `bookings` | Spotlight (Stripe) bookings |
| `badges`, `user_badges` | Gamification |
| `system_settings` | Runtime CMS settings |
| `audit_logs` | Admin/compliance audit |

---

## 6. Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `user_badges`, `chart_entries` |
| Columns | `snake_case` | `artist_id`, `created_at` |
| Indexes | `idx_<table>_<column(s)>` | `idx_releases_artist_id` |
| Triggers | `trg_<table>_<purpose>` | `trg_users_updated_at` |
| Policies | `"<table>: <actor> <action>"` | `"users: admin delete"` |
| Functions | `snake_case` | `get_my_role()` |

---

## 7. Audit & Compliance

- **Admin/role changes**: logged in `audit_logs`.
- **GDPR**: identity is pseudonymised at the analytics layer; no individual voter is exposed to partners. Voter data is minimised and retention-bound.

---

## 8. Checklist for Schema Changes

Before committing any schema change, verify:

- [ ] Added to `supabase/reset.sql` (CREATE or `ADD COLUMN IF NOT EXISTS`)
- [ ] A `supabase/migrations/YYYYMMDD_<slug>.sql` migration added for existing DBs
- [ ] `src/types/database.ts` updated (Row / Insert / Update shapes)
- [ ] No 3NF violations introduced (§ 2)
- [ ] RLS enabled and policies defined for the new table
- [ ] Index created for every FK and high-cardinality filter column
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` pass
