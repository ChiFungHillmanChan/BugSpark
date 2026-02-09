import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/shared/page-header';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Bug Reports" />);
    expect(screen.getByText('Bug Reports')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Bugs" description="All reported bugs" />);
    expect(screen.getByText('All reported bugs')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader title="Bugs" actions={<button>Create</button>} />,
    );
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders without description or actions', () => {
    const { container } = render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(container.querySelectorAll('.text-sm.text-gray-500')).toHaveLength(0);
  });
});
