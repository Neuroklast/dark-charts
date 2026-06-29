'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SPOTLIGHT_MAX_DAYS_AHEAD,
  SPOTLIGHT_SLOT_TYPES,
  formatSpotlightPrice,
  type SpotlightSlotType,
} from '@/lib/spotlight-config';
import 'react-day-picker/style.css';

interface BookingRow {
  id: string;
  slotDate: string;
  slotType: string;
  status: string;
  amountCents?: number | null;
  currency?: string | null;
}

export function SpotlightBookingView() {
  const { user, getAuthToken, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const [slotType, setSlotType] = useState<SpotlightSlotType>('BAND_OF_DAY');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [prices, setPrices] = useState<Record<SpotlightSlotType, { amountCents: number; currency: string }> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  const locale = language === 'en' ? 'en' : 'de';
  const role = user?.role?.toUpperCase();
  const canBook = role === 'BAND' || role === 'LABEL';

  const maxDate = useMemo(() => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + SPOTLIGHT_MAX_DAYS_AHEAD);
    return date;
  }, []);

  const loadBookings = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;

    setIsLoadingBookings(true);
    try {
      const res = await fetch('/api/spotlight/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings ?? []);
        setPrices(data.prices ?? null);
      }
    } catch {
      toast.error(t('spotlight.booking.loadFailed'));
    } finally {
      setIsLoadingBookings(false);
    }
  }, [getAuthToken, t]);

  useEffect(() => {
    if (user?.isAuthenticated) {
      void loadBookings();
    }
  }, [user?.isAuthenticated, loadBookings]);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const res = await fetch(`/api/spotlight/availability?slotType=${slotType}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.bookedDates)) {
          setBookedDates(new Set(data.bookedDates));
        }
      } catch {
        setBookedDates(new Set());
      }
    };
    void loadAvailability();
  }, [slotType]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast.success(t('spotlight.booking.paymentSuccess'));
      void loadBookings();
      window.history.replaceState({}, '', '/spotlight');
    }
    if (params.get('canceled') === '1') {
      toast.message(t('spotlight.booking.paymentCanceled'));
      window.history.replaceState({}, '', '/spotlight');
    }
  }, [loadBookings, t]);

  const selectedPrice = prices?.[slotType];

  const handleCheckout = async () => {
    if (!selectedDate) {
      toast.error(t('spotlight.booking.pickDate'));
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      toast.error(t('spotlight.booking.loginRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/spotlight/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotType,
          slotDate: selectedDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('spotlight.booking.checkoutFailed'));
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('spotlight.booking.checkoutFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 border border-border bg-card">
        <div className="animate-pulse h-32 bg-secondary/40" />
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase tracking-tight text-foreground">
          {t('spotlight.booking.title')}
        </h1>
        <p className="text-sm text-muted-foreground font-ui">{t('spotlight.booking.subtitle')}</p>
      </div>

      <Card className="p-6 border border-border bg-card space-y-6">
        {!user?.isAuthenticated ? (
          <p className="text-sm text-muted-foreground">{t('spotlight.booking.loginRequired')}</p>
        ) : !canBook ? (
          <p className="text-sm text-muted-foreground">{t('spotlight.booking.roleRequired')}</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-ui">
                {t('spotlight.booking.slotType')}
              </label>
              <Select value={slotType} onValueChange={(value) => setSlotType(value as SpotlightSlotType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPOTLIGHT_SLOT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`spotlight.booking.slot.${type}`)}
                      {prices?.[type]
                        ? ` — ${formatSpotlightPrice(prices[type].amountCents, prices[type].currency, locale)}`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-ui">
                {t('spotlight.booking.pickDateLabel')}
              </label>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const dayKey = date.toISOString().slice(0, 10);
                  if (bookedDates.has(dayKey)) return true;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || date > maxDate;
                }}
                className="rounded-md border border-border p-3"
              />
            </div>

            {selectedPrice && (
              <p className="text-sm text-muted-foreground">
                {t('spotlight.booking.price')}:{' '}
                <span className="text-foreground font-medium">
                  {formatSpotlightPrice(selectedPrice.amountCents, selectedPrice.currency, locale)}
                </span>
              </p>
            )}

            <Button onClick={handleCheckout} disabled={isSubmitting || !selectedDate}>
              {isSubmitting ? t('spotlight.booking.redirecting') : t('spotlight.booking.checkout')}
            </Button>

            <p className="text-xs text-muted-foreground">{t('spotlight.booking.disclaimer')}</p>
          </>
        )}
      </Card>

      {user?.isAuthenticated && (
        <Card className="p-6 border border-border bg-card">
          <h2 className="font-display text-lg uppercase text-foreground mb-4">
            {t('spotlight.booking.history')}
          </h2>
          {isLoadingBookings ? (
            <p className="text-sm text-muted-foreground">{t('spotlight.booking.loading')}</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('spotlight.booking.noBookings')}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"
                >
                  <span>
                    {booking.slotType} · {booking.slotDate.slice(0, 10)}
                  </span>
                  <span className="uppercase text-xs tracking-wider text-muted-foreground">
                    {booking.status}
                    {booking.amountCents
                      ? ` · ${formatSpotlightPrice(
                          booking.amountCents,
                          booking.currency ?? 'eur',
                          locale
                        )}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}