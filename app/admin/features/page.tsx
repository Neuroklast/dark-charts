import { AdminPageShell } from '../_components/AdminPageShell';
import { FeatureFlagsContainer } from '@/components/admin/FeatureFlagsContainer';

export const dynamic = 'force-dynamic';

export default function AdminFeaturesPage() {
  return (
    <AdminPageShell
      title="Features"
      description="Toggle platform features and experimental flags."
    >
      <FeatureFlagsContainer />
    </AdminPageShell>
  );
}