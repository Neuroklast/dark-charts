# Dark Charts

Independent music charts for the Heavy Metal, Gothic, Dark Wave, and EBM underground scene.

**Stack:** Next.js 16 · React 19 · Supabase · Vercel · Stripe (Spotlight)

## Quick start

```bash
cp .env.example .env.local   # fill Supabase + JWT_SECRET
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel, Supabase, Stripe webhook, and cron setup.

## Docs

| Topic | File |
|-------|------|
| Architecture | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |
| Agent rules | [.github/AGENTS.md](.github/AGENTS.md) |
| Agent workflows | [docs/agent/](docs/agent/) |
| Guidelines | [docs/guidelines/](docs/guidelines/) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build |
| `npm run preview` | Serve production build locally |

## License

Proprietary. © 2026 NEUROKLAST. All rights reserved.