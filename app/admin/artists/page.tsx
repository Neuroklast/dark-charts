import { AdminPageShell } from '../_components/AdminPageShell';
import { ArtistBlacklistContainer } from '@/components/admin/ArtistBlacklistContainer';

export const dynamic = 'force-dynamic';

export default function AdminArtistsPage() {
  return (
    <AdminPageShell
      title="Artists"
      description="Catalog visibility, blacklist management, and artist sync status."
    >
      <ArtistBlacklistContainer />
    </AdminPageShell>
  );
}