import React, { useEffect, useState } from 'react';
import { UserManagementView } from './UserManagementView';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function UserManagementContainer() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/users?page=1&limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        } else {
          toast.error('Failed to load users');
        }
      } catch (error) {
        toast.error('Network error loading users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSuspendUser = async (userId: string) => {
    // Optimistic UI update
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'SUSPENDED' } : u));
    toast.success('User suspended (optimistic)');

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'suspend', userId })
      });

      if (!res.ok) {
        throw new Error('API Error');
      }
    } catch (error) {
      toast.error('Failed to suspend user. Reverting.');
      setUsers(previousUsers);
    }
  };

  const handleResetCredits = async (userId: string) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'reset_credits', userId, credits: 0 })
      });

      if (res.ok) {
        toast.success('Credits reset to 0');
      } else {
        toast.error('Failed to reset credits');
      }
    } catch (error) {
      toast.error('Network error resetting credits');
    }
  };

  return (
    <UserManagementView
      users={users}
      isLoading={isLoading}
      onSuspendUser={handleSuspendUser}
      onResetCredits={handleResetCredits}
    />
  );
}
