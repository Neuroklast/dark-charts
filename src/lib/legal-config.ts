/**
 * Operator / legal contact details — configure via environment before production launch.
 * NEXT_PUBLIC_* vars are safe to expose (business contact info only).
 */

export interface LegalOperatorConfig {
  name: string;
  legalForm: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  privacyEmail: string;
  phone?: string;
  vatId?: string;
  representative?: string;
  isConfigured: boolean;
}

function env(key: string, fallback = ''): string {
  return process.env[key]?.trim() || fallback;
}

export function getLegalConfig(): LegalOperatorConfig {
  const name = env('NEXT_PUBLIC_LEGAL_OPERATOR_NAME');
  const email = env('NEXT_PUBLIC_LEGAL_EMAIL', 'legal@darkcharts.de');
  const privacyEmail = env('NEXT_PUBLIC_PRIVACY_EMAIL', email || 'privacy@darkcharts.de');

  return {
    name: name || '[Betreiber — in .env.local konfigurieren]',
    legalForm: env('NEXT_PUBLIC_LEGAL_FORM', 'Einzelunternehmen'),
    street: env('NEXT_PUBLIC_LEGAL_STREET', '[Straße und Hausnummer]'),
    zip: env('NEXT_PUBLIC_LEGAL_ZIP', '[PLZ]'),
    city: env('NEXT_PUBLIC_LEGAL_CITY', '[Ort]'),
    country: env('NEXT_PUBLIC_LEGAL_COUNTRY', 'Deutschland'),
    email,
    privacyEmail,
    phone: env('NEXT_PUBLIC_LEGAL_PHONE') || undefined,
    vatId: env('NEXT_PUBLIC_LEGAL_VAT_ID') || undefined,
    representative: env('NEXT_PUBLIC_LEGAL_REPRESENTATIVE') || name || undefined,
    isConfigured: Boolean(name && env('NEXT_PUBLIC_LEGAL_STREET') && env('NEXT_PUBLIC_LEGAL_CITY')),
  };
}