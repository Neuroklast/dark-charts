'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { DEFAULT_THEME_COLORS } from '@/config/defaultTheme';
import type { ThemeConfig } from '@/config/themeConfig';
import { ThemeEditorView } from './ThemeEditorView';

export function ThemeEditorContainer() {
  const [colors, setColors] = useState<NonNullable<ThemeConfig['colors']>>(DEFAULT_THEME_COLORS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/colors');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setColors({ ...DEFAULT_THEME_COLORS, ...data.themeConfig?.colors });
    } catch {
      toast.error('Failed to load theme');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch('/api/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeConfig: { colors } }),
      });
      if (!res.ok) throw new Error();
      toast.success('Theme saved');
      window.location.reload();
    } catch {
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => setColors(DEFAULT_THEME_COLORS);

  return (
    <ThemeEditorView
      colors={colors}
      isLoading={isLoading}
      isSaving={isSaving}
      onColorChange={handleColorChange}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}