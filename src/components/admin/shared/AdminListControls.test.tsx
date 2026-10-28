import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminPagination } from './AdminPagination';
import { AdminBulkToolbar } from './AdminBulkToolbar';

describe('shared admin list controls', () => {
  it('paginates without resetting the page or routing away', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<AdminPagination page={1} pageSize={10} total={53}
      onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    expect(screen.getByText('Seite 2 / 6')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    fireEvent.change(screen.getByLabelText('Einträge pro Seite'), { target: { value: '25' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('supports page selection, all-filtered selection and bulk actions', () => {
    const onSelect = vi.fn();
    const onAllMatchingChange = vi.fn();
    const onApprove = vi.fn();
    const { rerender } = render(<AdminBulkToolbar visibleIds={['a','b']}
      selectedIds={[]} total={42} allMatching={false}
      onSelect={onSelect} onAllMatchingChange={onAllMatchingChange}
      onApprove={onApprove} onHide={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /alle einträge auf dieser seite/i }));
    expect(onSelect).toHaveBeenCalledWith(['a', 'b']);
    fireEvent.click(screen.getByRole('button', { name: /alle 42 treffer auswählen/i }));
    expect(onAllMatchingChange).toHaveBeenCalledWith(true);
    rerender(<AdminBulkToolbar visibleIds={['a','b']}
      selectedIds={[]} total={42} allMatching={true}
      onSelect={onSelect} onAllMatchingChange={onAllMatchingChange}
      onApprove={onApprove} onHide={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Freigeben' }));
    expect(onApprove).toHaveBeenCalledOnce();
  });
});
