import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminApiKeysPage() {
  return (
    <AdminPageShell
      title="API Keys"
      description="Manage external API credentials and integration keys."
    >
      <AdminPlaceholder
        title="API credentials"
        description="API key management will be available in a future update."
      />
    </AdminPageShell>
  );
}