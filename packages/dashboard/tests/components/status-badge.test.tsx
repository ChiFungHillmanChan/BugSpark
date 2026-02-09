import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/bugs/status-badge';
import type { Status } from '@/types';

describe('StatusBadge', () => {
  const statuses: Status[] = ['new', 'triaging', 'in_progress', 'resolved', 'closed'];
  const labels: Record<Status, string> = {
    new: 'New',
    triaging: 'Triaging',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  it.each(statuses)('renders status text for "%s"', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(labels[status])).toBeInTheDocument();
  });

  it('applies correct color class for new', () => {
    const { container } = render(<StatusBadge status="new" />);
    expect(container.firstChild).toHaveClass('text-status-new');
  });

  it('applies correct color class for triaging', () => {
    const { container } = render(<StatusBadge status="triaging" />);
    expect(container.firstChild).toHaveClass('text-status-triaging');
  });

  it('applies correct color class for in_progress', () => {
    const { container } = render(<StatusBadge status="in_progress" />);
    expect(container.firstChild).toHaveClass('text-status-in-progress');
  });

  it('applies correct color class for resolved', () => {
    const { container } = render(<StatusBadge status="resolved" />);
    expect(container.firstChild).toHaveClass('text-status-resolved');
  });

  it('applies correct color class for closed', () => {
    const { container } = render(<StatusBadge status="closed" />);
    expect(container.firstChild).toHaveClass('text-status-closed');
  });
});
