import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminBadgesPage() {
  return (
    <AdminPageShell
      title="Badges"
      description="Manage fan and DJ achievement badges."
    >
      <AdminPlaceholder
        title="Badge management"
        description="Badge creation and assignment will be available in a future update."
      />
    </AdminPageShell>
  );
}