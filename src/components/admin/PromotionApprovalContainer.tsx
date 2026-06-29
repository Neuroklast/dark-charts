'use client';

import React, { useEffect, useState } from 'react';
import { PromotionApprovalView } from './PromotionApprovalView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function PromotionApprovalContainer() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await authFetch('/api/admin/promotions');
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings);
        } else {
          toast.error('Failed to load bookings');
        }
      } catch {
        toast.error('Network error loading bookings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    const prev = [...bookings];
    setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)));

    try {
      const res = await authFetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', bookingId, status }),
      });
      if (res.ok) {
        toast.success(`Booking ${status.toLowerCase()}`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to update booking status');
      setBookings(prev);
    }
  };

  return (
    <PromotionApprovalView
      bookings={bookings}
      isLoading={isLoading}
      onApprove={(id) => handleUpdateStatus(id, 'PAID')}
      onReject={(id) => handleUpdateStatus(id, 'CANCELLED')}
    />
  );
}