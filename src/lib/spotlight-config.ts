export const SPOTLIGHT_SLOT_TYPES = ['BAND_OF_DAY', 'DJ_OF_DAY'] as const;
export type SpotlightSlotType = (typeof SPOTLIGHT_SLOT_TYPES)[number];

export const SPOTLIGHT_BOOKING_ROLES = ['BAND', 'LABEL'] as const;

export interface SpotlightPrice {
  amountCents: number;
  currency: string;
  labelDe: string;
  labelEn: string;
}

export const SPOTLIGHT_PRICES: Record<SpotlightSlotType, SpotlightPrice> = {
  BAND_OF_DAY: {
    amountCents: 4_900,
    currency: 'eur',
    labelDe: 'Band des Tages',
    labelEn: 'Band of the Day',
  },
  DJ_OF_DAY: {
    amountCents: 3_900,
    currency: 'eur',
    labelDe: 'DJ des Tages',
    labelEn: 'DJ of the Day',
  },
};

export const SPOTLIGHT_MAX_DAYS_AHEAD = 90;
export const SPOTLIGHT_PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeSlotDate(input: string | Date): Date {
  const date = typeof input === 'string' ? new Date(input) : new Date(input);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function formatSpotlightPrice(amountCents: number, currency: string, locale: 'de' | 'en'): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}