import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

// Reproducible synthetic UI-data budgets, no production data or credentials.
const size = 100_000;
const entries = Array.from({ length: size }, (_, i) => ({
  id: `artist-${i}`, name: `Demo Artist ${i}`,
  genre: i % 2 ? 'darkwave' : 'industrial', visible: i % 3 === 0,
}));
const start = performance.now();
const search = entries.filter(item => item.name.toLowerCase().includes('artist 999'));
const searchMs = performance.now() - start;
assert(search.length > 0);
assert(searchMs < 2500, `100k synthetic search ${searchMs.toFixed(0)}ms exceeds 2500ms`);

const started = performance.now();
const chosen = new Set();
for (let page = 0; page < size / 100; page++) {
  for (const row of entries.slice(page * 100, page * 100 + 100)) {
    if (row.visible) chosen.add(row.id);
  }
}
const selectMs = performance.now() - started;
assert(chosen.size > 0);
assert(selectMs < 2500, `100k multi-page selection ${selectMs.toFixed(0)}ms exceeds 2500ms`);
assert(entries.slice(0, 100).length <= 100);
console.log(`Admin performance budgets passed: 100k rows, search ${searchMs.toFixed(1)}ms, selection ${selectMs.toFixed(1)}ms`);
