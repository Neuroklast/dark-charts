# Changelog

## [Unreleased]

### Fixed/Changed
- Deleted backup files (`src/App-backup.tsx`, `src/App-new-structure.tsx`, `src/App.new.tsx`).
- Deleted outdated task documents (`ARTWORK_LOADING_REQUIREMENTS.md`, and others identified in root directory).
- Extracted mathematical logic into `src/lib/math/normalization.ts` (Point normalization, Borda ranking, consensus bonus).
- Refactored `src/App.tsx` by separating logic into `src/providers/AppProviders.tsx` and `src/routes/AppContent.tsx` to follow Single Responsibility principle.
- Added Zod schemas to Vercel edge functions (`api/charts.ts`, `api/releases.ts`, `api/vote.ts`) for strict type safety and request validation.
