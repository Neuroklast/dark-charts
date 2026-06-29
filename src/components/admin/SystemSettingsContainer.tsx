'use client';

import React, { useEffect, useState } from 'react';
import { SystemSettingsView } from './SystemSettingsView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function SystemSettingsContainer() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        } else {
          toast.error('Failed to load settings');
        }
      } catch {
        toast.error('Network error loading settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (newSettings: any) => {
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
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
    <SystemSettingsView settings={settings} isLoading={isLoading} onSave={handleSave} />
  );
}