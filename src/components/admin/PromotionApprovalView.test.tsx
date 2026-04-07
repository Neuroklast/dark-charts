import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromotionApprovalView } from './PromotionApprovalView';
import React from 'react';

describe('PromotionApprovalView', () => {
  it('renders loading state', () => {
    render(<PromotionApprovalView isLoading={true} />);
    expect(screen.getByTestId('promotions-loading')).toBeDefined();
  });

  it('renders bookings and handles actions', () => {
    const mockBookings = [
      { id: '1', slotType: 'BAND_OF_DAY', slotDate: '2023-10-01T00:00:00Z', user: { email: 'band@test.com' }, status: 'PENDING' },
      { id: '2', slotType: 'DJ_OF_DAY', slotDate: '2023-10-02T00:00:00Z', user: { email: 'dj@test.com' }, status: 'PAID' }
    ];
    const mockApprove = vi.fn();
    const mockReject = vi.fn();

    render(<PromotionApprovalView bookings={mockBookings} onApprove={mockApprove} onReject={mockReject} />);

    expect(screen.getByText('BAND_OF_DAY')).toBeDefined();
    expect(screen.getByText('band@test.com')).toBeDefined();
    expect(screen.getByText('PENDING')).toBeDefined();

    const approveButtons = screen.getAllByText('Approve');
    fireEvent.click(approveButtons[0]);
    expect(mockApprove).toHaveBeenCalledWith('1');

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    expect(mockReject).toHaveBeenCalledWith('1');

    // Second row buttons should be disabled because status is PAID
    expect(approveButtons[1].hasAttribute('disabled')).toBe(true);
  });
});
