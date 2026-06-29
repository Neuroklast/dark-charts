# Architecture

Dark Charts follows the same patterns as [darktunes-website](https://github.com/Neuroklast/darktunes-website).

## Layers

| Layer | Path |
|-------|------|
| App Router | `app/` |
| API Route Handlers | `app/api/**/route.ts` |
| DAL | `src/lib/api/` |
| UI | `src/components/` |
| Hooks | `src/hooks/` |

## Routing

URL-based navigation via Next.js `<Link>`. Route helpers in `src/lib/routes.ts`.

## IoC

- Chart pages receive data via `ChartShellClient` context or props
- Admin containers receive callbacks via props
- No direct Supabase reads in presentational components

## Error handling

- API: `withErrorHandler` + `ApiError`
- UI: `app/error.tsx`, `ErrorBoundary`