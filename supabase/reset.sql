-- Dark Charts schema reset (idempotent)
-- Source of truth: src/types/database.ts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  role TEXT NOT NULL DEFAULT 'FAN',
  "isSuspended" BOOLEAN NOT NULL DEFAULT FALSE,
  "isPublicProfile" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trustLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "authProvider" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "oauthProviderId" TEXT;

CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "spotifyId" TEXT UNIQUE,
  genres TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  "profileLink" TEXT,
  "imageUrl" TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "labelId" UUID,
  country TEXT,
  "foundedYear" INTEGER,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  "isVisible" BOOLEAN NOT NULL DEFAULT TRUE,
  "socialLinks" JSONB,
  "itunesId" TEXT,
  "appleMusicUrl" TEXT,
  "lastSyncedAt" TIMESTAMPTZ,
  "source" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE artists ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "itunesId" TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "appleMusicUrl" TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMPTZ;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS "source" TEXT;

CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  "releaseType" TEXT NOT NULL DEFAULT 'single',
  "releaseDate" DATE NOT NULL,
  "spotifyId" TEXT UNIQUE,
  "odesliLinks" JSONB,
  "itunesArtworkUrl" TEXT,
  "vercelBlobUrl" TEXT,
  "r2ArtworkUrl" TEXT,
  "artistId" UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  "albumType" TEXT CHECK ("albumType" IN ('album', 'single', 'ep', 'compilation')),
  "totalTracks" INTEGER,
  "spotifyUrl" TEXT,
  "artworkUrl" TEXT,
  "highResArtworkUrl" TEXT,
  "platformLinks" JSONB,
  genres TEXT[] NOT NULL DEFAULT '{}',
  label TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT TRUE,
  "itunesId" TEXT,
  "appleMusicUrl" TEXT,
  "syncPolicy" TEXT NOT NULL DEFAULT 'auto',
  "source" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE releases ADD COLUMN IF NOT EXISTS "r2ArtworkUrl" TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "itunesId" TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "appleMusicUrl" TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "syncPolicy" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE releases ADD COLUMN IF NOT EXISTS "source" TEXT;

-- Durable artist sync queue (darktunes-style; survives Vercel cold starts)
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

CREATE TABLE IF NOT EXISTS fan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  "avatarUrl" TEXT,
  credits INTEGER NOT NULL DEFAULT 150,
  "remainingCredits" INTEGER NOT NULL DEFAULT 150,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dj_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  "displayName" TEXT,
  "soundcloudLink" TEXT,
  "expertStatus" BOOLEAN NOT NULL DEFAULT FALSE,
  "expertRequested" BOOLEAN NOT NULL DEFAULT FALSE,
  "reputationScore" NUMERIC NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dj_profiles ALTER COLUMN "reputationScore" SET DEFAULT 1;
UPDATE dj_profiles SET "reputationScore" = 1 WHERE "reputationScore" = 0;
ALTER TABLE dj_profiles ADD COLUMN IF NOT EXISTS "expertRequested" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dj_profiles ADD COLUMN IF NOT EXISTS "displayName" TEXT;

CREATE TABLE IF NOT EXISTS band_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "artistId" UUID REFERENCES artists(id) ON DELETE CASCADE,
  members TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE band_profiles ALTER COLUMN "artistId" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_band_profiles_artist_id_unique
  ON band_profiles ("artistId") WHERE "artistId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS label_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "companyName" TEXT NOT NULL,
  website TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chart_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement INTEGER NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  "fanScore" NUMERIC NOT NULL DEFAULT 0,
  "expertScore" NUMERIC NOT NULL DEFAULT 0,
  "communityPower" NUMERIC NOT NULL DEFAULT 0,
  "releaseId" UUID REFERENCES releases(id) ON DELETE SET NULL,
  "chartType" TEXT NOT NULL,
  genre TEXT,
  "weekStart" TIMESTAMPTZ NOT NULL,
  movement INTEGER NOT NULL DEFAULT 0,
  "trackId" UUID,
  "artistId" UUID REFERENCES artists(id) ON DELETE SET NULL,
  "weekNumber" INTEGER,
  year INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chart_entries ADD COLUMN IF NOT EXISTS genre TEXT;

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fanId" UUID NOT NULL REFERENCES fan_profiles(id) ON DELETE CASCADE,
  "releaseId" UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  "allocatedVotes" INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  "weekStart" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expert_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "djId" UUID NOT NULL REFERENCES dj_profiles(id) ON DELETE CASCADE,
  "releaseId" UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  "weekStart" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE votes ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMPTZ;
UPDATE votes
SET "weekStart" = (date_trunc('week', "createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
WHERE "weekStart" IS NULL;
ALTER TABLE votes ALTER COLUMN "weekStart" SET NOT NULL;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS "votes_fanId_releaseId_key";
CREATE UNIQUE INDEX IF NOT EXISTS votes_fan_release_week_idx ON votes ("fanId", "releaseId", "weekStart");

ALTER TABLE expert_votes ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMPTZ;
UPDATE expert_votes
SET "weekStart" = (date_trunc('week', "createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
WHERE "weekStart" IS NULL;
ALTER TABLE expert_votes ALTER COLUMN "weekStart" SET NOT NULL;
ALTER TABLE expert_votes DROP CONSTRAINT IF EXISTS "expert_votes_djId_releaseId_key";
CREATE UNIQUE INDEX IF NOT EXISTS expert_votes_dj_release_week_idx ON expert_votes ("djId", "releaseId", "weekStart");

CREATE TABLE IF NOT EXISTS streaming_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "artistId" UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  "spotifyPopularity" INTEGER NOT NULL DEFAULT 0,
  "youtubePopularity" INTEGER NOT NULL DEFAULT 0,
  "followerCount" INTEGER NOT NULL DEFAULT 0,
  "topTrackPopularity" INTEGER NOT NULL DEFAULT 0,
  "weekStart" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streaming_snapshots ADD COLUMN IF NOT EXISTS "youtubePopularity" INTEGER NOT NULL DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS radio_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "streamUrl" TEXT,
  "nowPlayingUrl" TEXT,
  "nowPlayingFormat" TEXT,
  country TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "discoverySource" TEXT NOT NULL DEFAULT 'manual',
  "externalId" TEXT,
  "homepageUrl" TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  bitrate INTEGER,
  codec TEXT,
  "monitorEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "legalHold" BOOLEAN NOT NULL DEFAULT FALSE,
  "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
  "lastProbeAt" TIMESTAMPTZ,
  "lastMetadataAt" TIMESTAMPTZ,
  "lastError" TEXT,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  "probeIntervalSeconds" INTEGER NOT NULL DEFAULT 45,
  "metadataMode" TEXT NOT NULL DEFAULT 'auto',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "discoverySource" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "homepageUrl" TEXT;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS bitrate INTEGER;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS codec TEXT;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "monitorEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "legalHold" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "healthStatus" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "lastProbeAt" TIMESTAMPTZ;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "lastMetadataAt" TIMESTAMPTZ;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "probeIntervalSeconds" INTEGER NOT NULL DEFAULT 45;
ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS "metadataMode" TEXT NOT NULL DEFAULT 'auto';

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
  "rawArtist" TEXT,
  "rawTitle" TEXT,
  "detectionMethod" TEXT NOT NULL DEFAULT 'icy',
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1,
  "streamHost" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE airplay_events ADD COLUMN IF NOT EXISTS "rawArtist" TEXT;
ALTER TABLE airplay_events ADD COLUMN IF NOT EXISTS "rawTitle" TEXT;
ALTER TABLE airplay_events ADD COLUMN IF NOT EXISTS "detectionMethod" TEXT NOT NULL DEFAULT 'icy';
ALTER TABLE airplay_events ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE airplay_events ADD COLUMN IF NOT EXISTS "streamHost" TEXT;

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

CREATE TABLE IF NOT EXISTS user_listening_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'spotify',
  "topArtistIds" TEXT[] NOT NULL DEFAULT '{}',
  "topTrackIds" TEXT[] NOT NULL DEFAULT '{}',
  "checkedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vote_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "weekStart" TIMESTAMPTZ NOT NULL,
  "anomalyType" TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  "releaseId" UUID REFERENCES releases(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vote_anomalies_week ON vote_anomalies ("weekStart");
CREATE INDEX IF NOT EXISTS idx_user_listening_user ON user_listening_snapshots ("userId", "checkedAt");

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "slotDate" TIMESTAMPTZ NOT NULL,
  "slotType" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "stripeSessionId" TEXT,
  "stripePaymentId" TEXT,
  "amountCents" INTEGER,
  currency TEXT DEFAULT 'eur',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  "iconUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "badgeId" UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "badgeId")
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  "isVotingPaused" BOOLEAN NOT NULL DEFAULT FALSE,
  "voiceCreditsBudget" INTEGER NOT NULL DEFAULT 150,
  "chartWeights" JSONB NOT NULL DEFAULT '{"fan":0.5,"expert":0.35,"streaming":0.15}'::jsonb,
  "featureFlags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "themeConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "radioMonitor" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS "radioMonitor" JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS radio_monitor_heartbeat (
  id TEXT PRIMARY KEY DEFAULT 'worker',
  "seenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "workerVersion" TEXT,
  "probesLastMinute" INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

INSERT INTO system_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists ("spotifyId");
CREATE INDEX IF NOT EXISTS idx_artists_is_visible ON artists ("isVisible");
CREATE INDEX IF NOT EXISTS idx_artists_itunes_id ON artists ("itunesId");
CREATE INDEX IF NOT EXISTS idx_artists_label_id ON artists ("labelId");
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON releases ("artistId");
CREATE INDEX IF NOT EXISTS idx_releases_spotify_id ON releases ("spotifyId");
CREATE INDEX IF NOT EXISTS idx_releases_is_visible ON releases ("isVisible");
CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_itunes_id_unique ON releases ("itunesId") WHERE "itunesId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chart_entries_chart_type_week ON chart_entries ("chartType", "weekStart");
CREATE INDEX IF NOT EXISTS idx_chart_entries_release_id ON chart_entries ("releaseId");
CREATE INDEX IF NOT EXISTS idx_chart_entries_genre ON chart_entries (genre, "chartType", "weekStart");
CREATE INDEX IF NOT EXISTS idx_votes_fan_id ON votes ("fanId");
CREATE INDEX IF NOT EXISTS idx_votes_release_id ON votes ("releaseId");
CREATE INDEX IF NOT EXISTS idx_votes_week_start ON votes ("weekStart");
CREATE INDEX IF NOT EXISTS idx_expert_votes_dj_id ON expert_votes ("djId");
CREATE INDEX IF NOT EXISTS idx_expert_votes_release_id ON expert_votes ("releaseId");
CREATE INDEX IF NOT EXISTS idx_expert_votes_week_start ON expert_votes ("weekStart");
CREATE INDEX IF NOT EXISTS idx_streaming_snapshots_artist_week ON streaming_snapshots ("artistId", "weekStart");
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_playlists_platform_external ON tracked_playlists (platform, "externalId");
CREATE INDEX IF NOT EXISTS idx_tracked_playlists_active ON tracked_playlists ("isActive");
CREATE INDEX IF NOT EXISTS idx_radio_stations_active ON radio_stations ("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS idx_radio_stations_source_external
  ON radio_stations ("discoverySource", "externalId")
  WHERE "externalId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_radio_stations_monitor
  ON radio_stations ("monitorEnabled", "legalHold", "lastProbeAt");
CREATE INDEX IF NOT EXISTS idx_airplay_events_station_observed
  ON airplay_events ("sourceStationId", "observedAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_airplay_events_idempotency ON airplay_events ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airplay_events_release_week ON airplay_events ("releaseId", "weekStart");
CREATE INDEX IF NOT EXISTS idx_airplay_events_week ON airplay_events ("weekStart");
CREATE UNIQUE INDEX IF NOT EXISTS idx_airplay_snapshots_release_week ON airplay_snapshots ("releaseId", "weekStart");
CREATE INDEX IF NOT EXISTS idx_airplay_snapshots_week ON airplay_snapshots ("weekStart");
CREATE INDEX IF NOT EXISTS idx_fan_profiles_user_id ON fan_profiles ("userId");
CREATE INDEX IF NOT EXISTS idx_dj_profiles_user_id ON dj_profiles ("userId");
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_scheduled ON sync_queue (status, "scheduledAt");
CREATE INDEX IF NOT EXISTS idx_sync_queue_artist_id ON sync_queue ("artistId");
CREATE INDEX IF NOT EXISTS idx_sync_logs_artist_id ON sync_logs ("artistId");
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs ("createdAt" DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE airplay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE airplay_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_monitor_heartbeat ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists' AND policyname = 'public_read_visible_artists'
  ) THEN
    CREATE POLICY public_read_visible_artists ON artists
      FOR SELECT
      USING ("isVisible" = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'releases' AND policyname = 'public_read_visible_releases'
  ) THEN
    CREATE POLICY public_read_visible_releases ON releases
      FOR SELECT
      USING ("isVisible" = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chart_entries' AND policyname = 'public_read_chart_entries'
  ) THEN
    CREATE POLICY public_read_chart_entries ON chart_entries
      FOR SELECT
      USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'badges' AND policyname = 'public_read_badges'
  ) THEN
    CREATE POLICY public_read_badges ON badges
      FOR SELECT
      USING (TRUE);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Auth helpers (idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'FAN');
  user_nickname text := COALESCE(NEW.raw_user_meta_data->>'nickname', 'Anonymous Fan');
BEGIN
  INSERT INTO public.users (
    id,
    email,
    role,
    "emailVerified",
    "authProvider",
    "createdAt",
    "updatedAt"
  ) VALUES (
    NEW.id,
    NEW.email,
    user_role,
    (NEW.email_confirmed_at IS NOT NULL),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "emailVerified" = EXCLUDED."emailVerified",
    "authProvider" = EXCLUDED."authProvider",
    "updatedAt" = NOW();

  IF user_role = 'FAN' AND NOT EXISTS (
    SELECT 1 FROM public.fan_profiles WHERE "userId" = NEW.id
  ) THEN
    INSERT INTO public.fan_profiles ("userId", nickname, credits, "remainingCredits")
    VALUES (NEW.id, user_nickname, 150, 150);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_read_own'
  ) THEN
    CREATE POLICY users_read_own ON public.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Service role bypasses RLS via the Supabase service_role key.

-- ---------------------------------------------------------------------------
-- 2026-10-28: Atomic, service-only operations for chart integrity
-- This section is additive. Review existing duplicated active spotlight slots
-- before running this script on an existing production database.
-- ---------------------------------------------------------------------------

-- Do not trust raw_user_meta_data.role: it is controlled by the registering user.
-- New signups always start as FAN. Privileged roles are assigned by trusted staff.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_nickname text := COALESCE(NEW.raw_user_meta_data->>'nickname', 'Anonymous Fan');
BEGIN
  INSERT INTO public.users (
    id, email, role, "emailVerified", "authProvider", "createdAt", "updatedAt"
  ) VALUES (
    NEW.id, NEW.email, 'FAN',
    (NEW.email_confirmed_at IS NOT NULL),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "emailVerified" = EXCLUDED."emailVerified",
    "authProvider" = EXCLUDED."authProvider",
    "updatedAt" = NOW();

  INSERT INTO public.fan_profiles ("userId", nickname, credits, "remainingCredits")
  VALUES (NEW.id, user_nickname, 150, 150)
  ON CONFLICT ("userId") DO NOTHING;
  RETURN NEW;
END;
$$;

-- Enforce one active booking per daily placement at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_active_slot
  ON public.bookings ("slotDate", "slotType")
  WHERE status IN ('pending', 'PAID');

CREATE OR REPLACE FUNCTION public.reserve_spotlight_slot(
  p_user_id uuid,
  p_slot_date timestamptz,
  p_slot_type text,
  p_amount_cents integer,
  p_currency text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
  v_slot_date timestamptz;
BEGIN
  IF p_user_id IS NULL OR p_slot_date IS NULL
     OR p_slot_type NOT IN ('BAND_OF_DAY', 'DJ_OF_DAY')
     OR p_amount_cents IS NULL OR p_amount_cents <= 0
     OR p_currency <> 'eur' THEN
    RAISE EXCEPTION 'INVALID_SPOTLIGHT_SLOT' USING ERRCODE = '22023';
  END IF;

  v_slot_date := date_trunc('day', p_slot_date AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  PERFORM pg_advisory_xact_lock(hashtextextended(p_slot_type || v_slot_date::text, 0));

  UPDATE public.bookings
     SET status = 'expired', "updatedAt" = NOW()
   WHERE "slotDate" = v_slot_date AND "slotType" = p_slot_type
     AND status = 'pending'
     AND "createdAt" < NOW() - INTERVAL '2 hours';

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE "slotDate" = v_slot_date AND "slotType" = p_slot_type
      AND status IN ('pending', 'PAID')
  ) THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.bookings (
    "userId", "slotDate", "slotType", status, "amountCents", currency
  ) VALUES (p_user_id, v_slot_date, p_slot_type, 'pending', p_amount_cents, p_currency)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_spotlight_slot(uuid,timestamptz,text,integer,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_spotlight_slot(uuid,timestamptz,text,integer,text)
  TO service_role;

-- A single transaction locks the credit account, validates the entire ballot,
-- inserts its votes and deducts credits. Any exception rolls back everything.
CREATE OR REPLACE FUNCTION public.cast_weekly_ballot(
  p_fan_id uuid,
  p_week_start timestamptz,
  p_credit_budget integer,
  p_votes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_remaining integer;
  v_total_cost bigint := 0;
  v_units integer;
  v_key text;
  v_value text;
  v_release_id uuid;
  v_rows jsonb := '[]'::jsonb;
  v_record public.votes%ROWTYPE;
  v_created jsonb := '[]'::jsonb;
  v_item jsonb;
BEGIN
  IF p_fan_id IS NULL OR p_week_start IS NULL
     OR p_credit_budget NOT BETWEEN 1 AND 10000
     OR p_votes IS NULL OR jsonb_typeof(p_votes) <> 'object'
     OR p_votes = '{}'::jsonb THEN
    RAISE EXCEPTION 'INVALID_BALLOT' USING ERRCODE = '22023';
  END IF;

  SELECT "remainingCredits" INTO v_remaining
  FROM public.fan_profiles WHERE id = p_fan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAN_PROFILE_NOT_FOUND' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.votes
    WHERE "fanId" = p_fan_id AND "weekStart" = p_week_start
  ) THEN
    RAISE EXCEPTION 'ALREADY_VOTED' USING ERRCODE = '23505';
  END IF;

  FOR v_key, v_value IN SELECT key, value FROM jsonb_each_text(p_votes)
  LOOP
    IF v_value !~ '^[1-9][0-9]{0,3}$' THEN
      RAISE EXCEPTION 'INVALID_VOTE_COUNT' USING ERRCODE = '22023';
    END IF;
    v_units := v_value::integer;
    v_release_id := v_key::uuid;

    IF NOT EXISTS (
      SELECT 1 FROM public.releases
      WHERE id = v_release_id AND "isVisible" = TRUE
        AND "releaseDate" <= CURRENT_DATE
        AND "releaseDate" >= (CURRENT_DATE - INTERVAL '12 months')::date
    ) THEN
      RAISE EXCEPTION 'RELEASE_NOT_ELIGIBLE' USING ERRCODE = '22023';
    END IF;

    v_total_cost := v_total_cost + v_units::bigint * v_units::bigint;
    IF v_total_cost > p_credit_budget OR v_total_cost > v_remaining THEN
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = '22023';
    END IF;

    v_rows := v_rows || jsonb_build_array(
      jsonb_build_object('releaseId', v_release_id, 'votes', v_units, 'cost', v_units * v_units)
    );
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_rows)
  LOOP
    INSERT INTO public.votes (
      "fanId", "releaseId", "allocatedVotes", cost, votes, credits, "weekStart"
    ) VALUES (
      p_fan_id, (v_item->>'releaseId')::uuid,
      (v_item->>'votes')::integer, (v_item->>'cost')::integer,
      (v_item->>'votes')::integer, (v_item->>'cost')::integer, p_week_start
    )
    RETURNING * INTO v_record;
    v_created := v_created || jsonb_build_array(to_jsonb(v_record));
  END LOOP;

  UPDATE public.fan_profiles
     SET "remainingCredits" = "remainingCredits" - v_total_cost::integer,
         "updatedAt" = NOW()
   WHERE id = p_fan_id;

  RETURN jsonb_build_object(
    'votes', v_created,
    'remainingCredits', v_remaining - v_total_cost::integer
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cast_weekly_ballot(uuid,timestamptz,integer,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cast_weekly_ballot(uuid,timestamptz,integer,jsonb)
  TO service_role;
