# Agent guidelines — Dark Charts

Read this first. Details live in linked docs (progressive disclosure).

## Stack

Next.js 16 App Router · TypeScript strict · Supabase · Vercel · Stripe

**Not used:** Prisma, Vite SPA, legacy `api/` serverless handlers.

## Non-negotiables

1. **Chart integrity** — Fan, expert, and streaming pools stay isolated until aggregation. No pay-to-win.
2. **No `any`** — Use `unknown` + type guards at API boundaries. Validate with Zod.
3. **Server writes** — Mutations go through `app/api/**/route.ts` with service-role Supabase, not client-side DB.
4. **Logging** — Use `logger` from `@/lib/logger`, not `console.*` in app code.
5. **Scope** — Only change what the task requires. No drive-by refactors.

## Where things live

| Layer | Path |
|-------|------|
| Routes / pages | `app/` |
| API handlers | `app/api/**/route.ts` |
| Shared logic | `src/lib/` |
| UI | `src/components/` |
| Schema | `supabase/reset.sql`, `supabase/migrations/` |
| Deploy config | `vercel.json`, `DEPLOYMENT.md` |

## Deep dives

- [Architecture](../docs/architecture/ARCHITECTURE.md)
- [Backend patterns](../docs/agent/backend.md)
- [Frontend patterns](../docs/agent/frontend.md)
- [Data & schema](../docs/agent/data-and-schema.md)
- [Testing](../docs/agent/testing-performance.md)
- [Workflow](../docs/agent/workflow.md)
- [Mandate](../docs/guidelines/AGENT_MANDATE.md)
- [Lessons learned](../docs/guidelines/LESSONS_LEARNED.md)

## Before shipping

```bash
npx tsc --noEmit && npm test && npm run build
```

Document user-facing changes in `CHANGELOG.md`.