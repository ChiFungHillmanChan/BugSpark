import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionTimeline } from '@/components/bug-detail/session-timeline';
import type { SessionEvent } from '@/types';

const sampleEvents: SessionEvent[] = [
  { type: 'click', target: 'button.submit', timestamp: 1000 },
  { type: 'navigate', target: '/dashboard', timestamp: 2000 },
  { type: 'error', target: 'TypeError: undefined', timestamp: 3000 },
];

describe('SessionTimeline', () => {
  it('renders timeline events', () => {
    render(<SessionTimeline events={sampleEvents} />);
    expect(screen.getByText('click')).toBeInTheDocument();
    expect(screen.getByText('navigate')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('shows event type and target', () => {
    render(<SessionTimeline events={sampleEvents} />);
    expect(screen.getByText('button.submit')).toBeInTheDocument();
    expect(screen.getByText('/dashboard')).toBeInTheDocument();
  });

  it('shows empty state for no events', () => {
    render(<SessionTimeline events={[]} />);
    expect(screen.getByText('No session events captured')).toBeInTheDocument();
  });

  it('handles null events prop', () => {
    render(<SessionTimeline events={null} />);
    expect(screen.getByText('No session events captured')).toBeInTheDocument();
  });
});
