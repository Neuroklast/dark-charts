'use client';

import React, { useEffect, useState } from 'react';
import { ArtistBlacklistView } from './ArtistBlacklistView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function ArtistBlacklistContainer() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlacklist = async () => {
      try {
        const res = await authFetch('/api/admin/artists');
        if (res.ok) {
          const data = await res.json();
          setBlacklist(data.blacklist);
        } else {
          toast.error('Failed to load blacklist');
        }
      } catch {
        toast.error('Network error loading blacklist');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlacklist();
  }, []);

  const handleUpdateStatus = async (artistId: string, status: string) => {
    const previous = [...blacklist];
    setBlacklist(blacklist.map((a) => (a.id === artistId ? { ...a, status } : a)));

    try {
      const res = await authFetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', artistId, status }),
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
      const res = await authFetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_sync' }),
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