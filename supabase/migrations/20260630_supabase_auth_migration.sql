-- Supabase Auth integration: sync auth.users → public.users

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

-- Allow authenticated users to read their own row
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