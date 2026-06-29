import { AdminPageShell } from '../_components/AdminPageShell';
import { ChartControlContainer } from '@/components/admin/ChartControlContainer';

export const dynamic = 'force-dynamic';

export default function AdminChartsPage() {
  return (
    <AdminPageShell
      title="Chart Control"
      description="Pause voting, trigger weekly recalculation, and monitor chart state."
    >
      <ChartControlContainer />
    </AdminPageShell>
  );
}