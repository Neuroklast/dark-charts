/**
 * Domain types for the playlists & radio-airplay tracker.
 *
 * The persisted shapes live in Supabase (see the airplay migration) and are
 * mirrored in `@/types/database`. These types describe the values the scoring
 * and rollup logic operates on, independent of the storage layer.
 */

export type AirplaySource = 'playlist' | 'radio' | 'dj';

/** A single observed placement/spin, as fed into the weekly rollup. */
export interface AirplayEventLike {
  releaseId: string | null;
  source: string;
  reach?: number | null;
  weight?: number | null;
  sourceStationId?: string | null;
}

/**
 * Per-release, per-week aggregate consumed by the chart aggregation job.
 * Mirrors the count columns of `airplay_snapshots`.
 */
export interface AirplayVolume {
  playlistAddCount: number;
  playlistReach: number;
  radioSpinCount: number;
  radioStationCount: number;
  djSpinCount: number;
  totalReach: number;
}

export interface AirplaySnapshotAggregate extends AirplayVolume {
  releaseId: string;
  weekStart: string;
}
