# Changelog

## [Unreleased]

### Added
- Durable catalog sync (darktunes-style): `sync_queue` / `sync_logs` schema, `POST /api/sync` + `/api/sync/queue`, `syncArtist` → Supabase + R2.
- darktunes catalog import: `POST /api/admin/import/darktunes`, `scripts/import-darktunes-catalog.ts`.
- CSV artist seed: `POST /api/admin/seed/artists` from `doc/consolidated_darkcharts_artists.csv`.
- Migration `supabase/migrations/20260807_durable_sync_queue.sql`.
- Demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`.
- `docs/guidelines/AGENT_MANDATE.md` – binding ruleset (SOLID, TDD, ISO/IEC 25010, Clean Code, iterative workflow, DoD checklist) for all agents and developers.
- `docs/guidelines/LESSONS_LEARNED.md` – living document to record failed approaches and final solutions.
- `docs/architecture/` directory containing all architectural and feature documentation moved from project root.
- `docs/guidelines/` directory containing agent and process governance documents.

### Changed
- Restructured documentation: moved all conceptual and feature documents from project root into `docs/architecture/`.
- `README.md` replaced with a proper project README including a full table-of-contents linking to `docs/guidelines/` and `docs/architecture/`.

### Fixed/Changed
- Deleted backup files (`src/App-backup.tsx`, `src/App-new-structure.tsx`, `src/App.new.tsx`).
- Deleted outdated task documents (`ARTWORK_LOADING_REQUIREMENTS.md`, and others identified in root directory).
- Extracted mathematical logic into `src/lib/math/normalization.ts` (Point normalization, Borda ranking, consensus bonus).
- Refactored `src/App.tsx` by separating logic into `src/providers/AppProviders.tsx` and `src/routes/AppContent.tsx` to follow Single Responsibility principle.
- Added Zod schemas to Vercel edge functions (`api/charts.ts`, `api/releases.ts`, `api/vote.ts`) for strict type safety and request validation.
