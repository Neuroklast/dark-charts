# Changelog

## [Unreleased]

### Added
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
