import React, { useEffect, useState } from 'react';
import { ArtistBlacklistView } from './ArtistBlacklistView';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function ArtistBlacklistContainer() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchBlacklist = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/artists', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBlacklist(data.blacklist);
        } else {
          toast.error('Failed to load blacklist');
        }
      } catch (error) {
        toast.error('Network error loading blacklist');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlacklist();
  }, []);

  const handleUpdateStatus = async (artistId: string, status: string) => {
    const previous = [...blacklist];
    setBlacklist(blacklist.map(a => a.id === artistId ? { ...a, status } : a));

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update_status', artistId, status })
      });
      if (res.ok) {
        toast.success(`Artist status updated to ${status}`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to update status');
      setBlacklist(previous);
    }
  };

  const handleForceSync = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'force_sync' })
      });
      if (res.ok) {
        toast.success('Sync triggered successfully');
      } else {
        toast.error('Failed to trigger sync');
      }
    } catch {
      toast.error('Network error during sync');
    }
  };

  return (
    <ArtistBlacklistView
      blacklist={blacklist}
      isLoading={isLoading}
      onUpdateStatus={handleUpdateStatus}
      onForceSync={handleForceSync}
    />
  );
}
