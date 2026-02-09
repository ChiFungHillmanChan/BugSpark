import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Bug } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Bugs" value={42} icon={Bug} />);
    expect(screen.getByText('Total Bugs')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    const { container } = render(<StatCard label="Open Bugs" value="15" icon={Bug} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Avg Time" value="2.5h" icon={Bug} />);
    expect(screen.getByText('2.5h')).toBeInTheDocument();
  });
});
