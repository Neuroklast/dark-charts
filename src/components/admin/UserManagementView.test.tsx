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
      { id: '1', email: 'test1@test.com', role: 'FAN', fanProfile: { remainingCredits: 100 } },
      { id: '2', email: 'test2@test.com', role: 'DJ', djProfile: { expertStatus: false, reputationScore: 1 } },
    ];
    const mockSuspend = vi.fn();
    const mockReset = vi.fn();
    const mockExpert = vi.fn();

    render(
      <UserManagementView
        users={mockUsers}
        onSuspendUser={mockSuspend}
        onResetCredits={mockReset}
        onToggleExpertStatus={mockExpert}
      />
    );

    expect(screen.getByText('test1@test.com')).toBeDefined();
    expect(screen.getByText('test2@test.com')).toBeDefined();

    const suspendButtons = screen.getAllByText('Suspend');
    fireEvent.click(suspendButtons[0]);
    expect(mockSuspend).toHaveBeenCalledWith('1');

    const resetButtons = screen.getAllByText('Reset Credits');
    fireEvent.click(resetButtons[0]);
    expect(mockReset).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByText('Grant Expert'));
    expect(mockExpert).toHaveBeenCalledWith('2', false);
  });
});
