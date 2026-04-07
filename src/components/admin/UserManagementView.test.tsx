import { describe, it, expect, vi } from 'vitest';
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { UserManagementView } from './UserManagementView';
import React from 'react';

describe('UserManagementView', () => {
  it('renders loading skeletons', () => {
    render(<UserManagementView isLoading={true} />);
    expect(screen.getByTestId('users-loading')).toBeDefined();
  });

  it('renders user list and handles actions', () => {
    const mockUsers = [
      { id: '1', email: 'test1@test.com', role: 'FAN' },
      { id: '2', email: 'test2@test.com', role: 'DJ' }
    ];
    const mockSuspend = vi.fn();
    const mockReset = vi.fn();

    render(<UserManagementView users={mockUsers} onSuspendUser={mockSuspend} onResetCredits={mockReset} />);

    expect(screen.getByText('test1@test.com')).toBeDefined();
    expect(screen.getByText('test2@test.com')).toBeDefined();

    const suspendButtons = screen.getAllByText('Suspend');
    fireEvent.click(suspendButtons[0]);
    expect(mockSuspend).toHaveBeenCalledWith('1');

    const resetButtons = screen.getAllByText('Reset Credits');
    fireEvent.click(resetButtons[1]);
    expect(mockReset).toHaveBeenCalledWith('2');
  });
});
