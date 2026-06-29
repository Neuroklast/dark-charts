'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemSettingsViewProps {
  settings?: any;
  isLoading?: boolean;
  onSave?: (settings: any) => void;
}

export function SystemSettingsView({ settings, isLoading, onSave }: SystemSettingsViewProps) {
  const [formData, setFormData] = useState({
    voiceCreditsBudget: 150,
    fanWeight: 0.55,
    expertWeight: 0.45,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        voiceCreditsBudget: settings.voiceCreditsBudget || 150,
        fanWeight: settings.chartWeights?.fan ?? 0.55,
        expertWeight: settings.chartWeights?.expert ?? 0.45,
      });
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card className="p-6 max-w-xl" data-testid="settings-loading">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  const handleSave = () => {
    onSave?.({
      voiceCreditsBudget: Number(formData.voiceCreditsBudget),
      chartWeights: {
        fan: Number(formData.fanWeight),
        expert: Number(formData.expertWeight),
        streaming: 0,
      },
    });
  };

  const isWeightValid =
    Math.abs(Number(formData.fanWeight) + Number(formData.expertWeight) - 1.0) < 0.01;

  return (
    <Card className="p-6 max-w-xl">
      <h2 className="text-xl font-display uppercase tracking-widest mb-6">Global Variables</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Voice Credits Weekly Budget</Label>
          <Input
            type="number"
            value={formData.voiceCreditsBudget}
            onChange={(e) => setFormData((p) => ({ ...p, voiceCreditsBudget: Number(e.target.value) }))}
          />
          <p className="text-xs text-muted-foreground font-ui">
            Global budget allocation for fans. Resets weekly after chart publication.
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <Label className="block mb-4">Hybrid Chart Weights (fan + club = 1.0)</Label>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-24 text-muted-foreground text-xs uppercase tracking-wider">Fan</Label>
              <Input
                type="number"
                step="0.05"
                value={formData.fanWeight}
                onChange={(e) => setFormData((p) => ({ ...p, fanWeight: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-muted-foreground text-xs uppercase tracking-wider">Club</Label>
              <Input
                type="number"
                step="0.05"
                value={formData.expertWeight}
                onChange={(e) => setFormData((p) => ({ ...p, expertWeight: Number(e.target.value) }))}
              />
            </div>
          </div>
          {!isWeightValid && (
            <p className="text-xs text-red-500 mt-2 font-ui">Warning: Fan + Club weights must sum to 1.0</p>
          )}
        </div>

        <Button
          className="w-full uppercase font-ui tracking-widest"
          onClick={handleSave}
          disabled={!isWeightValid}
        >
          Deploy Settings
        </Button>
      </div>
    </Card>
  );
}