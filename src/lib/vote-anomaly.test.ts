import { describe, it, expect } from 'vitest';
import { detectVoteAnomalies } from './vote-anomaly';

describe('vote-anomaly', () => {
  it('flags low-trust vote clusters on a release', () => {
    const weekStart = '2026-06-23T00:00:00.000Z';
    const anomalies = detectVoteAnomalies({
      weekStartIso: weekStart,
      votes: Array.from({ length: 10 }, (_, i) => ({
        fanId: `fan-${i}`,
        releaseId: 'release-1',
        cost: 1,
        createdAt: weekStart,
      })),
      fanProfiles: Array.from({ length: 10 }, (_, i) => ({
        id: `fan-${i}`,
        userId: `user-${i}`,
      })),
      users: Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        trustLevel: 0,
        createdAt: weekStart,
      })),
    });

    expect(anomalies.some((a) => a.anomalyType === 'LOW_TRUST_CLUSTER')).toBe(true);
    expect(anomalies[0].releaseId).toBe('release-1');
  });
});