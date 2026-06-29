# Deployment (Vercel + Next.js 16)

## 1. Vercel project setup

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output: App Router (no static export).
5. Optional local link: `npx vercel link` then `npx vercel env pull .env.local`.

Crons and API security headers are defined in `vercel.json`.

## 2. Database (Supabase)

1. Create a Supabase project.
2. Run `supabase/reset.sql` in the SQL Editor (fresh install).
3. For existing databases, also run `supabase/migrations/20260629_spotlight_stripe_columns.sql`.

## 3. Required environment variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role (API routes only) |
| `JWT_SECRET` | Server | JWT signing secret |
| `CRON_SECRET` | Server | Bearer token for `/api/cron/*` |
| `NEXT_PUBLIC_APP_URL` | All | Production URL (Stripe redirects, email links) |
| `SPOTIFY_CLIENT_ID` | Server | Spotify API |
| `SPOTIFY_CLIENT_SECRET` | Server | Spotify API |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | All | Spotify OAuth (PKCE) |

## 4. Recommended for production

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Email verification |
| `EMAIL_FROM` | Sender address |
| `STRIPE_SECRET_KEY` | Spotlight self-service checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature |
| `DATA_API_TOKEN` | Server-to-server `/api/v1/*` access |
| `ALLOWED_ORIGIN` | CORS origin (default `*`) |
| `NEXT_PUBLIC_LEGAL_*` | Imprint / privacy operator data |

See `.env.example` for the full list (R2, Google OAuth, admin bootstrap).

## 5. Stripe webhook

Register in Stripe Dashboard:

- **URL:** `https://<your-domain>/api/spotlight/webhook`
- **Events:** `checkout.session.completed`, `checkout.session.expired`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 6. Cron jobs (`vercel.json`)

| Schedule (UTC) | Path | Purpose |
|----------------|------|---------|
| `55 23 * * 0` | `/api/cron/aggregate-charts` | Weekly chart aggregation + anomaly detection |
| `0 4 * * *` | `/api/cron/sync-itunes-artwork` | iTunes → R2 cover cache |

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

## 7. Post-deploy checks

```bash
curl https://<your-domain>/api/health
```

- Register/login flow
- Email verification (Resend)
- Fan vote submission
- Admin: `/admin/anomalies`, `/admin/promotions`
- Spotlight checkout (Band/Label test account)

## 8. Local production preview

```bash
npm ci
npm run build
npm run preview
```