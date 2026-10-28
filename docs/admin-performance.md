# Universal Admin performance and moderation contract

This applies to **all current and future administrative data lists**. Do not build one-off
full-page reloads for a row mutation.

1. Use `useAdminList` for authenticated list views. It aborts outdated fetches, uses
   last-request-wins semantics and retains the previous rows during refresh.
2. Use `AdminPagination` at **both ends** of long lists. Default page size 10,
   offer 10/25/50/100, and fetch only that page with stable ordering and a total count.
3. Debounce text filters (300 ms), reset the page when a filter changes, and avoid
   fetching on every keystroke.
4. Render compact rows inside a bounded scroll area (typically 62vh); use a sticky
   table header and retain the user's position after mutations. Hide secondary
   data-entry/import panels until needed.
5. Optimistically update only affected rows. On failure restore the row, show the
   backend error and retain the current page and selection. Never call
   `window.location.reload()` or `router.refresh()` for a row-level action.
6. Where bulk actions make sense, use `AdminBulkToolbar` and a **single server-side
   request per operation**, not one HTTP request per selected row. Support both
   "this page" and "all matching" scopes with an explicit count/confirmation.
7. Bulk actions are admin-authenticated, validate all submitted IDs, respect the
   active filter, exclude restricted/banned records and must not expose a partial
   success as a clean success. Batch writes and record audit events; reconcile
   the list once after a bulk operation.
8. Bulk all-matching requests are capped at 1000 verified matches. The server checks
   the exact result count to avoid silently truncating a database query. Narrow the
   filter for larger result sets.
9. Never process entire catalogs in a client component just to paginate them. Use
   server-side indexed filters and a stable secondary ID sort key.
10. Do not block the entire admin page for a single network action. Prefer
    row-local disabled/loading state and background revalidation.

Currently adopted by Artists, Catalog Review, Releases, Votes, Users, Anomalies
and the background-refreshed Badge panel. Other management panels should adopt
these primitives whenever they are modified.
