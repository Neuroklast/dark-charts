import { AdminPageShell } from '../_components/AdminPageShell';
import { AnomaliesContainer } from '@/components/admin/AnomaliesContainer';

export const dynamic = 'force-dynamic';

export default function AdminAnomaliesPage() {
  return (
    <AdminPageShell
      title="Anomalies"
      description="Review flagged voting patterns and mark incidents as resolved."
    >
      <AnomaliesContainer />
    </AdminPageShell>
  );
}