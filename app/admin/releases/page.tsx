import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminReleasesPage() {
  return (
    <AdminPageShell
      title="Releases"
      description="Browse and manage releases in the chart catalog."
    >
      <AdminPlaceholder
        title="Release catalog"
        description="Release management and catalog sync controls will be available in a future update."
      />
    </AdminPageShell>
  );
}