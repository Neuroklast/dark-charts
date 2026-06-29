'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CircleNotch } from '@phosphor-icons/react';

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isLoading, getAuthToken } = useAuth();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const verifyAdmin = async () => {
      const token = await getAuthToken();
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.replace('/');
          return;
        }

        const data = await res.json();
        if (data.user?.role !== 'ADMIN') {
          router.replace('/');
          return;
        }

        setVerified(true);
      } catch {
        router.replace('/');
      }
    };

    verifyAdmin();
  }, [isLoading, getAuthToken, router]);

  if (isLoading || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleNotch className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}