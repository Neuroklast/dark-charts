# Lessons Learned

Distilled anti-patterns from project history. **Append session findings before opening a PR** when the session uncovered a recurring anti-pattern or process gap — see `docs/agent/workflow.md` → *Living docs*.

---

## Schema & data layer

| Anti-pattern | Rule |
|--------------|------|
| `@prisma/client` being re-added / used at runtime | ⛔ Prisma is retired. `prisma/schema.prisma` + `src/backend/repositories/prisma/*` are legacy. Use `src/backend/repositories/supabase/*` + the `I*Repository` interfaces. |
| Schema edited only in `reset.sql` | Keep `supabase/reset.sql` (bootstrap) + `supabase/migrations/*.sql` (incremental) + `src/types/database.ts` in sync. Fold new changes into `reset.sql` AND add a migration. |
| Copying darktunes rule “no `supabase/migrations/`” | Dark Charts **does** use incremental migrations (unlike darktunes). Apply the migration to existing DBs; `reset.sql` remains the full fresh-install bootstrap. |
| Public reads with `select('*')` | Use strict column whitelists on public surfaces; keep secrets out of public rows. |

## Chart & math

| Anti-pattern | Rule |
|--------------|------|
| Mixing pillars before aggregation | Fan / Expert / Streaming pools stay isolated until `ChartAggregationService`. Never merge for a UI shortcut. |
| Letting revenue touch ranking | Spotlight revenue must never write a paid signal into a ranking pillar. |
| Ignoring vote velocity anomalies | Surface anomalies; a high-severity unresolved anomaly blocks voting on affected releases. |
| Raw streaming counts as a popularity signal | Normalise by listener loyalty (streams ÷ unique listeners), not raw click counts. |

## Voting & auth

| Anti-pattern | Rule |
|--------------|------|
| Trusting all registered accounts equally | Weight by `TRUST_LEVEL_WEIGHTS` (unverified < verified email < OAuth < OAuth+history). |
| Skipping email verification before voting | Voters must be verified (403 `EMAIL_NOT_VERIFIED`), except OAuth-verified flows. |
| Demo login in production | Disable unless `ALLOW_DEMO_LOGIN=1`. |

## Docs & process

| Anti-pattern | Rule |
|--------------|------|
| Stale docs after a code change | Agents **always** refresh markdown at session end (`AGENTS.md` + `docs/agent/*` + `CHANGELOG` + relevant living docs). |
| Prisma / legacy beliefs in docs | Verify the codebase each session; retired stacks stay documented as retired. |
| Bloated duplicate prose across agent docs | Progressive disclosure: `AGENTS.md` index + topic files. |

---

## Session additions

<!-- Append dated entries here using the template below. Newest first. -->

### Template for new entries

```
### YYYY-MM-DD — Short title

**Symptom:** …
**Cause:** …
**Rule / Fix:** …
```
