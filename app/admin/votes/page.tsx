import { AdminPageShell } from '../_components/AdminPageShell';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const dynamic = 'force-dynamic';

export default function AdminVotesPage() {
  return (
    <AdminPageShell
      title="Votes"
      description="Inspect individual votes and investigate voting activity."
    >
      <AdminPlaceholder
        title="Vote inspector"
        description="Detailed vote lookup and filtering will be available in a future update."
      />
    </AdminPageShell>
  );
}