# Radio monitor worker

Always-on process that polls public Icecast/SHOUTcast now-playing metadata. It does **not** archive audio.

Run locally:

```bash
npx --yes tsx workers/radio-monitor/index.ts
```

Required env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Admin → Features must enable **Radio monitor**, and Admin → Radio Monitor settings must set **enabled**. Stations stay candidates until an admin turns monitoring on.

Build image:

```bash
docker build -f workers/radio-monitor/Dockerfile -t dark-charts-radio-monitor .
```

Target host: a small always-on VPS (Hetzner CX22 is enough for a few hundred short metadata probes). Fly.io Machines work. Cloud Run and Vercel are the wrong runtime for this loop.

## Production deployment

The public /radio route and the Admin Radio Monitor are part of the Next.js web app.
Stream polling is a separate always-on process and **does not run on Vercel**.
No audio is archived or retained.

On a host with Docker Compose, from the repository root:
```sh
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
# Provide SUPABASE_SERVICE_ROLE_KEY through your host's secret mechanism, never in Git.
docker compose -f workers/radio-monitor/compose.yml up -d --build
docker compose -f workers/radio-monitor/compose.yml logs -f radio-monitor
```

1. Check /admin/radio/Overview for a fresh worker heartbeat.
2. Search station directories under /admin/radio/Discover; candidate stations are off by default.
3. Review each stream and enable Monitor for trusted stations.
4. Enable both the Radio monitor feature flag and Radio Monitor → Settings → Master enable.
5. Verify /admin/radio/Events is receiving actual song changes, then open /radio.
6. Monitor error rates, timeouts, missing metadata and coverage before publicizing any rankings.

The public explorer uses up to 5,000 recent stored observations in the selected
1/7/30-day period. It warns if this sample is truncated. This is **not** a census
of all internet radio or a replacement for licensed full-market airplay reporting.

Security: the worker only accepts public HTTP(S) hosts with DNS checks and
does not follow metadata URL redirects. Keep workers on an egress-restricted
network if possible. Do not put SUPABASE_SERVICE_ROLE_KEY in any NEXT_PUBLIC_
variable or client-side code. For multi-worker production use, add a database
lease to avoid parallel station polling.
