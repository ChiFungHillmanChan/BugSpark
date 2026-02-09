import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/shared/empty-state';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No bugs" description="Everything is clean" />);
    expect(screen.getByText('No bugs')).toBeInTheDocument();
    expect(screen.getByText('Everything is clean')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Nothing here"
        icon={<svg data-testid="icon" />}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(
      <EmptyState
        title="No bugs"
        description="Nothing here"
        action={<button>Add Bug</button>}
      />,
    );
    expect(screen.getByText('Add Bug')).toBeInTheDocument();
  });

  it('renders without icon or action', () => {
    const { container } = render(
      <EmptyState title="Empty" description="No items" />,
    );
    expect(container.querySelector('[data-testid="icon"]')).toBeNull();
  });
});
