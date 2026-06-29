import { AdminPageShell } from '../_components/AdminPageShell';
import { PromotionApprovalContainer } from '@/components/admin/PromotionApprovalContainer';

export const dynamic = 'force-dynamic';

export default function AdminSpotlightPage() {
  return (
    <AdminPageShell
      title="Spotlight"
      description="Approve or reject promotion booking requests from artists."
    >
      <PromotionApprovalContainer />
    </AdminPageShell>
  );
}