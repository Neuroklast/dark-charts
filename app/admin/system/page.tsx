import { AdminPageShell } from '../_components/AdminPageShell';
import { SystemDiagnosticsContainer } from '@/components/admin/SystemDiagnosticsContainer';

export const dynamic = 'force-dynamic';

export default function AdminSystemPage() {
  return (
    <AdminPageShell
      title="System"
      description="Infrastructure status, maintenance mode, and system diagnostics."
    >
      <SystemDiagnosticsContainer />
    </AdminPageShell>
  );
}