'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from './_components/AdminAuthGuard';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminLayout linkMode>{children}</AdminLayout>
    </AdminAuthGuard>
  );
}