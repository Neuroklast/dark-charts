import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminColorsPage() {
  return (
    <AdminPageShell
      title="Colors"
      description="Customize theme colors and visual branding."
    >
      <AdminPlaceholder
        title="Theme editor"
        description="Live theme color editing will be available in a future update."
      />
    </AdminPageShell>
  );
}