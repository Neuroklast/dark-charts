# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Changed
- Documentation restructured to the darktunes-website system: root agent index (`AGENTS.md`), root living docs (`PRD.md`, `ADMIN.md`, `SECURITY.md`, `INTEGRATION-SUMMARY.md`, `QA_CHECKLIST.md`, `E2E-TESTS.md`, `LESSONS_LEARNED.md`), `docs/RELEASING.md`, progressive-disclosure `docs/agent/*`, `supabase/*` docs, and `.github/pull_request_template.md`. The former `docs/architecture/` and `docs/guidelines/` folders were folded into `docs/agent/` and `AGENTS.md` and removed.

## Previous release waves

### Added
- Durable catalog sync (darktunes-style): `sync_queue` / `sync_logs` schema, `POST /api/sync` + `/api/sync/queue`, `syncArtist` → Supabase + R2.
- darktunes catalog import: `POST /api/admin/import/darktunes`, `scripts/import-darktunes-catalog.ts`.
- CSV artist seed: `POST /api/admin/seed/artists` from `doc/consolidated_darkcharts_artists.csv`.
- Migration `supabase/migrations/20260807_durable_sync_queue.sql`.
- Demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`.
- Binding ruleset (SOLID, TDD, ISO/IEC 25010, Clean Code, iterative workflow, DoD checklist) merged into `AGENTS.md`.

### Changed
- Restructured documentation: conceptual and feature documents moved from project root into `docs/agent/`.
- `README.md` replaced with a full project README including a table of contents.

### Fixed/Changed
- Deleted backup files (`src/App-backup.tsx`, `src/App-new-structure.tsx`, `src/App.new.tsx`).
- Deleted outdated task documents (`ARTWORK_LOADING_REQUIREMENTS.md` and others identified in the root directory).
- Extracted mathematical logic into `src/lib/math/normalization.ts` (Point normalization, Borda ranking, consensus bonus).
- Refactored `src/App.tsx` by separating logic into `src/providers/AppProviders.tsx` and `src/routes/AppContent.tsx` to follow Single Responsibility.
- Added Zod schemas to Vercel edge functions (`api/charts.ts`, `api/releases.ts`, `api/vote.ts`) for strict type safety and request validation.
