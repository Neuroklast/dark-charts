import { AdminClientLayout } from './_components/AdminClientLayout';
import { AdminAuthGuard } from './_components/AdminAuthGuard';

export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminClientLayout>{children}</AdminClientLayout>
    </AdminAuthGuard>
  );
}