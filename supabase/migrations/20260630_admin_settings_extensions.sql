-- Extend system_settings for feature flags and theme customization
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS "featureFlags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "themeConfig" JSONB NOT NULL DEFAULT '{}'::jsonb;