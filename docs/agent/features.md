# Features & Product Surface

The Dark Charts product surface — pillars, voting, taxonomy, revenue isolation, and the admin control plane. Concept source: [`src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md`](../../src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md).

> **Cardinal rule:** no paid signal may ever influence a ranking pillar. Revenue (Spotlight) is marketing placement only.

## Chart pillars

| Pillar | Algorithm | Route | Service |
|--------|-----------|-------|---------|
| Fan | Quadratic Voting + trust weight | `/charts/fan` | `src/lib/math/quadratic.ts`, `fan-scoring.ts` |
| Expert | Bayesian ranking + reputation | `/charts/expert` | `src/lib/math/expert-ranking.ts` |
| Streaming | Loyalty quotient (Spotify/YouTube 85/15) | `/charts/streaming` | `StreamingChartCalculationService.ts` |
| Combined | Weighted merge | `/charts` | `ChartAggregationService.ts` |

`/charts/archive` + `/history` expose rolling weekly arcs. Anomalies (`vote-anomaly.ts` / `vote-anomaly-guard.ts`) flag unusual vote velocity; a high-severity unresolved anomaly blocks voting on the affected release (`/api/vote/blocked-releases`).

## Quadratic Voting

- Fans receive a periodic `voice credits` budget (`src/lib/math/quadratic.ts`); cost = votes². Concentrating votes on one release is expensive, so breadth is rewarded.
- Trust levels (`src/lib/trust-level.ts`) scale weight: unverified email `0.1`, verified `0.5`, OAuth `1.0`, OAuth + listening history `1.25`.
- Voting requires email verification (OAuth flows excepted) — `requireVerifiedVoter` (403 `EMAIL_NOT_VERIFIED`).
- Vote receipt + status endpoints: `/api/vote/receipt`, `/api/vote/status`.

## Expert voting

Verified DJs/curators submit top-N bulk votes. A Bayesian prior keeps a single 5-star outlier from outranking a large consensus; reputation weights reward DJs whose picks later chart (`expert-ranking.ts`).

## Streaming calculation

Spotify + YouTube are merged 85/15 and normalised by a loyalty quotient (streams ÷ unique listeners) so dedicated fan bases beat algorithmic background plays (`StreamingChartCalculationService.ts`).

## Genre taxonomy

SSOT `src/lib/config/genres.ts` — `Gothic`, `Metal`, `Dark Electro`, `Crossover`, each with ordered subgenres. Subgenre charts may accumulate over longer windows and only activate past a voting threshold; subgenre votes roll up into the parent main genre (`src/lib/genre-aggregation.ts`, `genre-charts.ts`). Routes: `/genre/[main]` and `/genre/[main]/[sub]`.

## Custom charts

`/custom-charts` — fans weight the three pillars (e.g. 50/30/20) to build a personalised discovery list (`ChartShellClient`, `HomeChartsView`).

## Spotlight (revenue — isolated)

Self-service promotional placement (Band of the Week, sponsors, subgenre headers) via Stripe checkout. Routes: `/api/spotlight/availability` (list bookable slots), `/bookings`, `/checkout`, `/webhook`. A booking is only listed after a verified `checkout.session.completed`. `src/lib/stripe.ts`, `spotlight-config.ts`. Revenue never affects rankings.

- Public: `/spotlight`
- Admin: `/admin/spotlight` (approvals + management)

## Badges & promotions

- Badges (`BadgeService`, `BadgeDefinitions`) reward community behaviour (e.g. “Early Adopter” for discovering a band before it charts).
- Promotions (`PromotionService`) manage curated feature surfaces, reviewed in `/admin/promotions`.

## Roles

`FAN` · `DJ` · `BAND` · `LABEL` · `ADMIN`. Voting gated by role for the expert pool; email verification for fans. Admin `ADMIN`/`editor` roles gate `/admin/*` via `proxy.ts`.

## Feature flags

`/admin/features` toggles product surfaces at runtime; admin reads via `systemSettings.ts` / `settingsExtensions.ts`. Never hardcode a flag in a public path.

## Admin control plane

`ADMIN_NAV_GROUPS` (`src/lib/admin/nav.ts`): CONTENT (Artists, Releases), CHARTS (Chart Control, Anomalies, Votes), MANAGEMENT (Users, Spotlight, Analytics, Badges), SYSTEM (Settings, Features, Colors, API Keys, System). Plus **Metrics** and **Promotions**.

- **Chart Control** — pause/resume voting, trigger weekly recalc.
- **Anomalies** — review aggregation anomalies; block/unblock releases.
- **Settings** — chart weights and the fan credit budget.

## Catalog & media

- Durable `sync_queue` / `sync_logs`; iTunes + Spotify + Odesli; R2 cover art (`r2Utils.ts`).
- Import: `POST /api/admin/import/darktunes`; seed: `POST /api/admin/seed/artists` (CSV from `doc/consolidated_darkcharts_artists.csv`).
- `src/lib/catalog/importDarktunes.ts`, `seedConsolidatedArtists.ts`.

## Data API

Server-to-server `/api/v1/*` (charts, artists/top, categories/top, search, overview) behind `DATA_API_TOKEN` or a session (`requireApiAccess`).

## Legal & compliance

Bilingual legal pages via `src/lib/legal-content.ts`; operator data from `NEXT_PUBLIC_LEGAL_*`; `src/lib/legal-config.ts`. GDPR: pseudonymised/aggregated analytics only — never expose an individual voter.
