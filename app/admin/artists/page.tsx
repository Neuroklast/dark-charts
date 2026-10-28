import { AdminPageShell } from '../_components/AdminPageShell';
import { ArtistIntakeContainer } from '@/components/admin/ArtistIntakeContainer';
import { ArtistBlacklistContainer } from '@/components/admin/ArtistBlacklistContainer';

export const dynamic = 'force-dynamic';

export default function AdminArtistsPage() {
  return (
    <AdminPageShell
      title="Artists"
      description="Artists manuell anlegen, CSV importieren und vorhandene Einträge verwalten."
    >
      <ArtistIntakeContainer />
      <div className="mt-8"><ArtistBlacklistContainer /></div>
    </AdminPageShell>
  );
}