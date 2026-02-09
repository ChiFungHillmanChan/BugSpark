import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../test-utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Delete bug?',
    message: 'This action cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders when open', () => {
    renderWithIntl(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete bug?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithIntl(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Delete bug?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    renderWithIntl(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    renderWithIntl(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows destructive variant styling', () => {
    renderWithIntl(<ConfirmDialog {...defaultProps} isDestructive confirmLabel="Delete" />);
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('bg-red-600');
  });
});
