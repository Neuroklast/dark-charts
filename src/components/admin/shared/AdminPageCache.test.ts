import { describe, expect, it } from 'vitest';
import { AdminPageCache } from './useAdminList';

describe('admin list cache', () => {
  it('reuses fresh pages and expires stale pages', () => {
    const cache = new AdminPageCache<string>();
    cache.put('/artists?page=0', { rows: ['a'], total: 2 }, 1000);
    expect(cache.get('/artists?page=0', 1001)?.rows).toEqual(['a']);
    expect(cache.get('/artists?page=0', 31001)).toBeNull();
  });
  it('invalidates changed pages without throwing away the entire list', () => {
    const cache = new AdminPageCache<string>();
    cache.put('page1', { rows: ['a'], total: 2 }, 1000);
    cache.put('page2', { rows: ['b'], total: 2 }, 1000);
    cache.invalidate('page1');
    expect(cache.get('page1', 1001)).toBeNull();
    expect(cache.get('page2', 1001)?.rows).toEqual(['b']);
  });
  it('never retains unbounded page history', () => {
    const cache = new AdminPageCache<number>();
    for (let n = 0; n < 50; n++) cache.put(String(n), { rows: [n], total: 50 }, 1000);
    expect(cache.get('0', 1001)).toBeNull();
    expect(cache.get('49', 1001)?.rows).toEqual([49]);
  });
});
