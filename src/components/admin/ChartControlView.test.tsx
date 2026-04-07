import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartControlView } from './ChartControlView';
import React from 'react';

describe('ChartControlView', () => {
  it('renders loading state', () => {
    render(<ChartControlView isLoading={true} />);
    expect(screen.getByTestId('chart-control-loading')).toBeDefined();
  });

  it('renders chart controls and handles actions', () => {
    const mockCharts = [
      { id: '1', weekStart: '2023-10-01T00:00:00.000Z', chartType: 'OVERALL', _count: { entries: 100 } }
    ];
    const mockTogglePause = vi.fn();
    const mockRecalculate = vi.fn();

    render(
      <ChartControlView
        charts={mockCharts}
        isVotingPaused={false}
        onTogglePause={mockTogglePause}
        onRecalculate={mockRecalculate}
      />
    );

    expect(screen.getByText('Voting Active')).toBeDefined();

    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);
    expect(mockTogglePause).toHaveBeenCalled();

    expect(screen.getByText(/2023/)).toBeDefined();

    const recalcButton = screen.getByText('Recalculate');
    fireEvent.click(recalcButton);
    expect(mockRecalculate).toHaveBeenCalledWith('2023-10-01T00:00:00.000Z');
  });
});
