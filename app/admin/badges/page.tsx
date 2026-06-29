import { AdminPageShell } from '../_components/AdminPageShell';
import { BadgeManagementContainer } from '@/components/admin/BadgeManagementContainer';

export const dynamic = 'force-dynamic';

export default function AdminBadgesPage() {
  return (
    <AdminPageShell
      title="Badges"
      description="Manage fan and DJ achievement badges."
    >
      <BadgeManagementContainer />
    </AdminPageShell>
  );
}