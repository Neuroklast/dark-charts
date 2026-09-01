-- Playlists & radio-airplay tracker foundation
-- Idempotent: safe to run on existing dark-charts databases.
--
-- Adds curated source registries (tracked_playlists, radio_stations), a raw
-- observation log (airplay_events) and a weekly per-release rollup
-- (airplay_snapshots) that feeds the airplay chart signal. No existing table
-- is modified, so this migration is non-breaking on its own.

-- Curated playlist sources we scan for release presence.
CREATE TABLE IF NOT EXISTS tracked_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "curatorName" TEXT,
  "followerCount" INTEGER NOT NULL DEFAULT 0,
  url TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Curated radio / web-radio stations we poll for now-playing metadata.
CREATE TABLE IF NOT EXISTS radio_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "streamUrl" TEXT,
  "nowPlayingUrl" TEXT,
  "nowPlayingFormat" TEXT,
  country TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw airplay observations. One row per detected placement/spin.
CREATE TABLE IF NOT EXISTS airplay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "releaseId" UUID REFERENCES releases(id) ON DELETE CASCADE,
  "artistId" UUID REFERENCES artists(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  "sourcePlaylistId" UUID REFERENCES tracked_playlists(id) ON DELETE SET NULL,
  "sourceStationId" UUID REFERENCES radio_stations(id) ON DELETE SET NULL,
  "sourceLabel" TEXT,
  position INTEGER,
  reach INTEGER NOT NULL DEFAULT 0,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  "observedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "weekStart" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly per-release rollup consumed by the chart aggregation job.
CREATE TABLE IF NOT EXISTS airplay_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "releaseId" UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  "weekStart" TIMESTAMPTZ NOT NULL,
  "playlistAddCount" INTEGER NOT NULL DEFAULT 0,
  "playlistReach" INTEGER NOT NULL DEFAULT 0,
  "radioSpinCount" INTEGER NOT NULL DEFAULT 0,
  "radioStationCount" INTEGER NOT NULL DEFAULT 0,
  "djSpinCount" INTEGER NOT NULL DEFAULT 0,
  "totalReach" INTEGER NOT NULL DEFAULT 0,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_playlists_platform_external
  ON tracked_playlists (platform, "externalId");
CREATE INDEX IF NOT EXISTS idx_tracked_playlists_active
  ON tracked_playlists ("isActive");
CREATE INDEX IF NOT EXISTS idx_radio_stations_active
  ON radio_stations ("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS idx_airplay_events_idempotency
  ON airplay_events ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airplay_events_release_week
  ON airplay_events ("releaseId", "weekStart");
CREATE INDEX IF NOT EXISTS idx_airplay_events_week
  ON airplay_events ("weekStart");

CREATE UNIQUE INDEX IF NOT EXISTS idx_airplay_snapshots_release_week
  ON airplay_snapshots ("releaseId", "weekStart");
CREATE INDEX IF NOT EXISTS idx_airplay_snapshots_week
  ON airplay_snapshots ("weekStart");

ALTER TABLE tracked_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE airplay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE airplay_snapshots ENABLE ROW LEVEL SECURITY;
