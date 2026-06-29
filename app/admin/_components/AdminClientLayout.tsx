'use client';

import { Suspense, type ReactNode } from 'react';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';

interface AdminClientLayoutProps {
  children: ReactNode;
}

export function AdminClientLayout({ children }: AdminClientLayoutProps) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden md:flex-row bg-background">
      <AdminSidebarNav />
      <main className="flex-1 flex flex-col min-h-0">
        <Suspense>
          <div
            className="flex-1 overflow-y-auto min-h-0"
            style={{ overscrollBehavior: 'contain' }}
            data-lenis-prevent
          >
            {children}
          </div>
        </Suspense>
        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground/30 select-none">Dark Charts Admin</p>
        </div>
      </main>
    </div>
  );
}