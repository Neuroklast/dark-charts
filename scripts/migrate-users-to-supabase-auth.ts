/**
 * One-time migration: create Supabase Auth users for legacy public.users rows.
 *
 * Usage:
 *   npx tsx scripts/migrate-users-to-supabase-auth.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, emailVerified, passwordHash')
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Failed to load users:', error.message);
    process.exit(1);
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users ?? []) {
    const { data: existingAuth } = await supabase.auth.admin.getUserById(user.id);

    if (existingAuth.user) {
      skipped += 1;
      continue;
    }

    const tempPassword = `${crypto.randomUUID()}Aa1!`;

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: tempPassword,
      email_confirm: user.emailVerified ?? false,
      user_metadata: { role: user.role, migrated: true },
    });

    if (createError || !created.user) {
      console.error(`Failed for ${user.email}:`, createError?.message);
      failed += 1;
      continue;
    }

    migrated += 1;
    console.log(`Migrated ${user.email} (${user.role}) — send password reset if needed`);
  }

  console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});