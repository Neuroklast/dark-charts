import { AdminPageShell } from '../_components/AdminPageShell';
import { SystemSettingsContainer } from '@/components/admin/SystemSettingsContainer';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      title="Settings"
      description="Chart weights, credit budgets, and platform configuration."
    >
      <SystemSettingsContainer />
    </AdminPageShell>
  );
}