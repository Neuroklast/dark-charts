# Pre-Release QA Checklist — Dark Charts

## Functional Tests
- [ ] Public routes load: `/`, `/charts/[pillar]`, `/charts/archive`, `/history`, `/genre/[main]`, `/custom-charts`, `/methodology`, `/spotlight`, `/about`, `/imprint`, `/privacy`, `/terms`
- [ ] Chart pillars render correct data for a seeded week (Fan / Expert / Streaming / Combined)
- [ ] Genre pages: main genre lists subgenres; subgenre page filters correctly (niche windows applied)
- [ ] Methodology page explains the weighted merge and pillar isolation
- [ ] Voting: verified voter can cast votes; cost rises quadratically; receipt + confirmation render
- [ ] Voting: unverified email is rejected (403 `EMAIL_NOT_VERIFIED`)
- [ ] Voting: a release blocked by a high-severity anomaly cannot receive votes (`/api/vote/blocked-releases`)
- [ ] Custom charts builder: weights persist and produce a personalised list
- [ ] Spotlight: availability lists bookable slots; Stripe checkout completes; webhook creates the booking
- [ ] Spotlight booking never appears in any ranking pillar
- [ ] `/api/v1/*` returns charts/artists/categories/search/overview with a valid Bearer token

## Security
- [ ] Unauthenticated requests to `/admin/*` redirect to `/login`
- [ ] A non-admin session is bounced with `?error=unauthorized`
- [ ] Protected APIs reject missing/invalid JWTs (401)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never present in client HTML
- [ ] `/api/v1/*` rejects a missing/invalid Bearer (401)
- [ ] Cron routes reject a missing/wrong `CRON_SECRET` (401)
- [ ] Fan vote with unverified email is rejected (403)
- [ ] External API calls back off on 429 (no runaway requests)
- [ ] `npm audit` (high severity) clean before release
- [ ] Trust-level weighting applied (unverified < verified < OAuth)

## Roles & RLS
- [ ] `FAN` / `DJ` / `BAND` / `LABEL` / `ADMIN` role flows behave correctly
- [ ] `api_credentials` is admin-only (RLS) and never returns decrypted values on GET
- [ ] Votes/spotlight tables are not writable by the anon client
- [ ] Role changes affect access immediately (no re-login needed)

## Database & Sync
- [ ] Schema parity: `reset.sql` bootstrap + `migrations/` + `src/types/database.ts` in sync
- [ ] Durable sync queue drains; `sync_queue` / `sync_logs` populated
- [ ] Darktunes import + scene-artist CSV seed produce visible releases/artists
- [ ] R2 cover-art cache: artwork lands on CDN; fallback to external URL on failure
- [ ] `POST /api/sync` (with `CRON_SECRET`) drains the queue; `/api/sync/queue` enqueues
- [ ] `/api/cron/aggregate-charts` runs and produces anomalies (if any)

## Accessibility (WCAG 2.1 AA)
- [ ] Keyboard-only navigation across public journeys
- [ ] Visible focus-visible rings on interactive elements
- [ ] Mobile touch targets ≥ 44×44 (chart nav, voting controls)
- [ ] Reduced-motion preference respected in animated components
- [ ] Semantic landmarks + skip-to-main link

## Responsive Design
- [ ] Chart tables/genre grids render on desktop/tablet/mobile
- [ ] No horizontal overflow on ~360px
- [ ] Voting and custom-charts controls usable on touch

## Performance
- [ ] Public chart pages render promptly with ISR/caching
- [ ] `npm run build` completes without errors
- [ ] No unnecessary client-side data fetches on public RSC pages

## Documentation
- [ ] `README.md` reflects current setup and QA commands
- [ ] `DEPLOYMENT.md` up to date (crons, Stripe webhook, env)
- [ ] `AGENTS.md` + `docs/agent/*` aligned with implementation

## Test Execution
- [ ] Unit tests (`npm test`) pass
- [ ] `npm run ci` green (lint → typecheck → tests → build)

## Legal & Consent
- [ ] `/imprint`, `/privacy`, `/terms` render operator data from `NEXT_PUBLIC_LEGAL_*`
- [ ] Email verification works (Resend or Supabase built-in)
- [ ] Demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`
