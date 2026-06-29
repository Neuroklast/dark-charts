import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminSystemPage() {
  return (
    <AdminPageShell
      title="System"
      description="Infrastructure status, maintenance mode, and system diagnostics."
    >
      <AdminPlaceholder
        title="System diagnostics"
        description="System health monitoring and maintenance controls will be available in a future update."
      />
    </AdminPageShell>
  );
}