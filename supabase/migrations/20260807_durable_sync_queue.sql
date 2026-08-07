-- Durable sync queue + catalog fields for production release sync
-- Idempotent: safe on existing dark-charts databases

ALTER TABLE artists ADD COLUMN IF NOT EXISTS "itunesId" TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "appleMusicUrl" TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMPTZ;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "source" TEXT;

ALTER TABLE releases ADD COLUMN IF NOT EXISTS "itunesId" TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "appleMusicUrl" TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "syncPolicy" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "source" TEXT;

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "artistId" UUID REFERENCES artists(id) ON DELETE CASCADE,
  "jobType" TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  "scheduledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "startedAt" TIMESTAMPTZ,
  "finishedAt" TIMESTAMPTZ,
  "lockedUntil" TIMESTAMPTZ,
  "cancelRequestedAt" TIMESTAMPTZ,
  "cancelledAt" TIMESTAMPTZ,
  "errorMessage" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "artistId" UUID REFERENCES artists(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  message TEXT,
  "releasesSynced" INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  "apiSource" TEXT,
  "durationMs" INTEGER,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artists_itunes_id ON artists ("itunesId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_itunes_id_unique ON releases ("itunesId") WHERE "itunesId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_scheduled ON sync_queue (status, "scheduledAt");
CREATE INDEX IF NOT EXISTS idx_sync_queue_artist_id ON sync_queue ("artistId");
CREATE INDEX IF NOT EXISTS idx_sync_logs_artist_id ON sync_logs ("artistId");
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs ("createdAt" DESC);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
