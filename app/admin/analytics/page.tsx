import { AdminPageShell } from '../_components/AdminPageShell';
import { DashboardMetricsContainer } from '@/components/admin/DashboardMetricsContainer';

export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  return (
    <AdminPageShell
      title="Analytics"
      description="Platform metrics, API health status, and recent audit activity."
    >
      <DashboardMetricsContainer />
    </AdminPageShell>
  );
}