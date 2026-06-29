import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';

interface KeyStatus {
  key: string;
  label: string;
  configured: boolean;
  hint: string | null;
  required: boolean;
}

function envHint(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

const KEY_DEFINITIONS: Array<Omit<KeyStatus, 'configured' | 'hint'>> = [
  { key: 'DATA_API_TOKEN', label: 'Data API token', required: false },
  { key: 'CRON_SECRET', label: 'Cron secret', required: false },
  { key: 'JWT_SECRET', label: 'JWT secret (legacy)', required: true },
  { key: 'SPOTIFY_CLIENT_ID', label: 'Spotify client ID', required: false },
  { key: 'SPOTIFY_CLIENT_SECRET', label: 'Spotify client secret', required: false },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe secret key', required: false },
  { key: 'RESEND_API_KEY', label: 'Resend API key', required: false },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key', required: true },
];

export const GET = withAdminAuth(async () => {
  const keys: KeyStatus[] = KEY_DEFINITIONS.map((def) => {
    const value = process.env[def.key];
    return {
      ...def,
      configured: Boolean(value),
      hint: envHint(value),
    };
  });

  const v1Endpoints = [
    '/api/v1/overview',
    '/api/v1/charts',
    '/api/v1/artists/top',
    '/api/v1/categories/top',
    '/api/v1/search',
  ];

  return NextResponse.json({
    keys,
    v1Endpoints,
    rotationNote:
      'API keys and secrets are managed via deployment environment variables. Update them in your hosting provider and redeploy.',
  });
});