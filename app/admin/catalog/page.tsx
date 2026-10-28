import { AdminPageShell } from '../_components/AdminPageShell';
import { CatalogModerationContainer } from '@/components/admin/CatalogModerationContainer';

export const dynamic = 'force-dynamic';

export default function CatalogModerationPage() {
  return (
    <AdminPageShell
      title="Catalog review"
      description="Approve artists first, then review their discovered releases. Imports stay private until accepted."
    >
      <CatalogModerationContainer />
    </AdminPageShell>
  );
}
