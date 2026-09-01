# Releasing (SemVer)

Dark Charts deploys continuously from `main` (Vercel). **Git tags + `package.json` version** label a product release for support, changelog, and traceability.

## Source of truth

| Item | Authority |
|------|-----------|
| Current product version | `package.json` → `"version"` (mirrored in lockfile root) |
| Historical releases | Annotated git tags `vX.Y.Z` + `CHANGELOG.md` sections |
| Deploy identity | Commit SHA (`VERCEL_GIT_COMMIT_SHA` / `GITHUB_SHA`) |
| Runtime display | `GET /api/health` → version/commit (where wired) |

Do **not** confuse with domain versions or dependency bumps (Dependabot).

## When to bump

| Bump | Use for |
|------|---------|
| **MAJOR** (`X.0.0`) | Breaking product/API; incompatible schema requiring coordinated downtime/reset semantics |
| **MINOR** (`x.Y.0`) | User-facing features, new routes/surfaces, new integrations |
| **PATCH** (`x.Y.Z`) | Bugfixes, a11y, performance, safe dependency updates, product-visible docs fixes |

You can still merge and deploy anytime; cut a version when you want a labeled release (end of a feature wave, hotfix, support milestone).

## Ritual

1. **Land the product work** on a branch; keep bullets under `CHANGELOG.md` → `[Unreleased]` while developing (user-facing only — see [docs/agent/workflow.md](docs/agent/workflow.md)).
2. **Cut the changelog:** move Unreleased bullets into `## [X.Y.Z] — YYYY-MM-DD`. Leave `[Unreleased]` empty (or only post-cut WIP).
3. **Bump package version** (`"version"` in `package.json` / lockfile root) to match the changelog section.
4. **Verify:** `npm run ci` (or at least `npx tsc --noEmit` + `npm test` + `npm run build`).
5. **Commit** version + changelog + code together (Conventional Commits welcome: `chore(release): 1.6.0`).
6. **Tag:**
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
7. Optional GitHub Release:
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "See CHANGELOG.md section [X.Y.Z]."
   ```

> **Note:** Unlike the darktunes family, dark-charts does not yet ship `npm run release:*` wrapper scripts — bump the version manually. The `[RELEASE]` commit-message convention (`vercel.json ignoreCommand`) is respected so a release commit can skip a redundant deploy.

## Version hygiene

No fake SemVer: if you release, set `package.json` to a real version and tag it. Commits that only bump Dependabot dependencies are not app releases.
