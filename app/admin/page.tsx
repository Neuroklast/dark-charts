'use client';

import { AdminArtistManagement } from '@/components/AdminArtistManagement';
import { ArtistDatabaseManager } from '@/components/ArtistDatabaseManager';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminArtistManagement />
      <ArtistDatabaseManager />
    </div>
  );
}