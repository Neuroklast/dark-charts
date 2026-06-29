import { AdminPageShell } from '../_components/AdminPageShell';
import { ReleaseCatalogContainer } from '@/components/admin/ReleaseCatalogContainer';

export const dynamic = 'force-dynamic';

export default function AdminReleasesPage() {
  return (
    <AdminPageShell
      title="Releases"
      description="Browse and manage releases in the chart catalog."
    >
      <ReleaseCatalogContainer />
    </AdminPageShell>
  );
}