import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtistBlacklistView } from './ArtistBlacklistView';
import React from 'react';

describe('ArtistBlacklistView', () => {
  it('renders loading state', () => {
    render(<ArtistBlacklistView isLoading={true} />);
    expect(screen.getByTestId('blacklist-loading')).toBeDefined();
  });

  it('renders blacklist and handles actions', () => {
    const mockBlacklist = [
      { id: '1', name: 'Bad Band', spotifyId: '123', status: 'BANNED' },
      { id: '2', name: 'Restricted Act', spotifyId: '456', status: 'RESTRICTED' }
    ];
    const mockUpdateStatus = vi.fn();
    const mockForceSync = vi.fn();

    render(<ArtistBlacklistView blacklist={mockBlacklist} onUpdateStatus={mockUpdateStatus} onForceSync={mockForceSync} />);

    expect(screen.getByText('Bad Band')).toBeDefined();
    expect(screen.getByText('BANNED')).toBeDefined();

    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);
    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'ACTIVE');

    const banButtons = screen.getAllByText('Ban');
    fireEvent.click(banButtons[0]);
    expect(mockUpdateStatus).toHaveBeenCalledWith('2', 'BANNED');

    const syncButton = screen.getByText('Force Odesli Sync');
    fireEvent.click(syncButton);
    expect(mockForceSync).toHaveBeenCalled();
  });
});
