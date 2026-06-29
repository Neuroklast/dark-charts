import { AdminPageShell } from '../_components/AdminPageShell';
import { UserManagementContainer } from '@/components/admin/UserManagementContainer';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      title="Users"
      description="Manage roles, suspension, DJ expert status, and fan credits."
    >
      <UserManagementContainer />
    </AdminPageShell>
  );
}