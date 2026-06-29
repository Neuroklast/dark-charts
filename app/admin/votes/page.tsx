import { AdminPageShell } from '../_components/AdminPageShell';
import { VoteInspectorContainer } from '@/components/admin/VoteInspectorContainer';

export const dynamic = 'force-dynamic';

export default function AdminVotesPage() {
  return (
    <AdminPageShell
      title="Votes"
      description="Inspect individual votes and investigate voting activity."
    >
      <VoteInspectorContainer />
    </AdminPageShell>
  );
}