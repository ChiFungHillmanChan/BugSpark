import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonChart } from '@/components/shared/skeleton-loader';

describe('Skeleton', () => {
  it('renders with custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-1/2" />);
    expect(container.firstChild).toHaveClass('animate-shimmer');
    expect(container.firstChild).toHaveClass('h-4');
  });
});

describe('SkeletonCard', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('SkeletonTableRow', () => {
  it('renders correct number of cells', () => {
    const { container } = render(
      <table>
        <tbody>
          <SkeletonTableRow />
        </tbody>
      </table>,
    );
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(6);
  });
});

describe('SkeletonChart', () => {
  it('renders a skeleton element', () => {
    const { container } = render(<SkeletonChart />);
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
  });
});
