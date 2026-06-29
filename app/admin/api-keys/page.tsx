import { AdminPageShell } from '../_components/AdminPageShell';
import { ApiKeysContainer } from '@/components/admin/ApiKeysContainer';

export const dynamic = 'force-dynamic';

export default function AdminApiKeysPage() {
  return (
    <AdminPageShell
      title="API Keys"
      description="Manage external API credentials and integration keys."
    >
      <ApiKeysContainer />
    </AdminPageShell>
  );
}