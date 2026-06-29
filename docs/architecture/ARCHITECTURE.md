# Architecture

Dark Charts is a Next.js 16 App Router application backed by Supabase PostgreSQL.

## Request flow

```
Browser → app/(main)/* pages → fetch /api/* → src/lib/* → Supabase (service role)
```

Public chart data is served from aggregated `chart_entries`. Voting writes go through transactional helpers in `src/lib/api/`.

## Chart pillars

| Pillar | Source | Notes |
|--------|--------|-------|
| Fan | `votes` + quadratic credits | Trust-weighted, weekly |
| Expert | `expert_votes` | Verified DJs, top-10 bulk |
| Streaming | Spotify + YouTube (85/15) | Normalized popularity |
| Combined | `ChartAggregationService` | Weighted merge |

Weekly cron (`/api/cron/aggregate-charts`) runs aggregation and anomaly detection. High-severity unresolved anomalies block voting on affected releases.

## Key modules

| Area | Path |
|------|------|
| Fan voting | `src/lib/api/fan-vote.ts`, `app/api/vote/route.ts` |
| Vote conflicts | `src/lib/vote-conflicts.ts` |
| Anomaly guard | `src/lib/vote-anomaly.ts`, `src/lib/vote-anomaly-guard.ts` |
| Spotlight | `app/api/spotlight/*`, `src/lib/stripe.ts` |
| Auth | `src/backend/services/AuthService.ts`, `src/lib/api-auth.ts` |
| Charts UI | `app/(main)/_components/ChartShellClient.tsx` |

## Auth & roles

JWT in `Authorization: Bearer`. Roles: `FAN`, `DJ`, `BAND`, `LABEL`, `ADMIN`. Email verification required before voting (except OAuth-verified flows).

## Deployment

Vercel hosts the Next.js app. Cron jobs and env vars are documented in [DEPLOYMENT.md](../../DEPLOYMENT.md).

## Legal & compliance

Bilingual legal pages via `src/lib/legal-content.ts`. Operator data from `NEXT_PUBLIC_LEGAL_*` env vars.