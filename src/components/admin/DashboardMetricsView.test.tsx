import { describe, it, expect } from 'vitest';
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { DashboardMetricsView } from './DashboardMetricsView';
import React from 'react';

describe('DashboardMetricsView', () => {
  it('renders loading skeletons when isLoading is true', () => {
    render(<DashboardMetricsView isLoading={true} />);
    expect(screen.getByTestId('metrics-loading')).toBeDefined();
  });

  it('renders metrics data correctly', () => {
    const mockMetrics = {
      users: { total: 100, fans: 80, djs: 20 },
      artists: 50
    };
    render(<DashboardMetricsView metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('80')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
  });
});
