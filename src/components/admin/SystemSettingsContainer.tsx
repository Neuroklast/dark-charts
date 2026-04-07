import React, { useEffect, useState } from 'react';
import { SystemSettingsView } from './SystemSettingsView';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function SystemSettingsContainer() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        } else {
          toast.error('Failed to load settings');
        }
      } catch (error) {
        toast.error('Network error loading settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (newSettings: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success('Settings deployed successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Network error saving settings');
    }
  };

  return (
    <SystemSettingsView
      settings={settings}
      isLoading={isLoading}
      onSave={handleSave}
    />
  );
}
