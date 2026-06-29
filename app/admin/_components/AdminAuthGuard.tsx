'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CircleNotch } from '@phosphor-icons/react';
import { ROUTES } from '@/lib/routes';

const ADMIN_ROLES = new Set(['ADMIN', 'admin']);

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user?.isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(ROUTES.admin)}`);
      return;
    }

    if (!user.role || !ADMIN_ROLES.has(user.role)) {
      router.replace('/login?error=unauthorized');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user?.isAuthenticated || !user.role || !ADMIN_ROLES.has(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleNotch className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}