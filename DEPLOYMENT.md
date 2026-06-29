# Deployment

Deploy to **Vercel** with Next.js 16.

## Required environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key |
| `JWT_SECRET` | Admin/user JWT signing secret |
| `CRON_SECRET` | Vercel cron auth bearer token |
| `SPOTIFY_CLIENT_ID` | Server Spotify credentials |
| `SPOTIFY_CLIENT_SECRET` | Server Spotify credentials |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | Client OAuth (PKCE) |

## Optional

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public CDN base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (server) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth (client) |
| `ALLOWED_ORIGIN` | CORS allowed origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_INIT_SECRET` | One-time admin bootstrap |

## Database

1. Create Supabase project
2. Paste and run `supabase/reset.sql` in SQL Editor

## Build

```bash
npm ci
npm run build
```

## Cron

Configured in `vercel.json`: Sunday 23:55 UTC → `/api/cron/aggregate-charts`