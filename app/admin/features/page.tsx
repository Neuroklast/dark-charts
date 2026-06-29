import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminFeaturesPage() {
  return (
    <AdminPageShell
      title="Features"
      description="Toggle platform features and experimental flags."
    >
      <AdminPlaceholder
        title="Feature flags"
        description="Feature toggle controls will be available in a future update."
      />
    </AdminPageShell>
  );
}