import { AdminPageShell } from './_components/AdminPageShell';
import { AdminOverview } from '@/components/admin/AdminOverview';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <AdminPageShell
      title="Dashboard"
      description="Overview of platform activity and quick links to admin sections."
    >
      <AdminOverview />
    </AdminPageShell>
  );
}