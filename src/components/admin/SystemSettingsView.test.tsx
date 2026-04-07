import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemSettingsView } from './SystemSettingsView';
import React from 'react';

describe('SystemSettingsView', () => {
  it('renders loading state', () => {
    render(<SystemSettingsView isLoading={true} />);
    expect(screen.getByTestId('settings-loading')).toBeDefined();
  });

  it('renders settings form and handles save', () => {
    const mockSettings = {
      voiceCreditsBudget: 200,
      chartWeights: { fan: 0.6, expert: 0.3, streaming: 0.1 }
    };
    const mockSave = vi.fn();

    render(<SystemSettingsView settings={mockSettings} onSave={mockSave} />);

    const budgetInput = screen.getByDisplayValue('200');
    expect(budgetInput).toBeDefined();

    const saveButton = screen.getByText('Deploy Settings');
    fireEvent.click(saveButton);

    expect(mockSave).toHaveBeenCalledWith({
      voiceCreditsBudget: 200,
      chartWeights: { fan: 0.6, expert: 0.3, streaming: 0.1 }
    });
  });
});
