import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsoleLogViewer } from '@/components/bug-detail/console-log-viewer';
import type { ConsoleLogEntry } from '@/types';

const sampleLogs: ConsoleLogEntry[] = [
  { level: 'error', message: 'Something failed', stack: 'Error: at line 42', timestamp: 1000 },
  { level: 'warn', message: 'Deprecation warning', timestamp: 2000 },
  { level: 'info', message: 'App started', timestamp: 3000 },
  { level: 'log', message: 'User clicked', timestamp: 4000 },
  { level: 'debug', message: 'Render cycle', timestamp: 5000 },
];

describe('ConsoleLogViewer', () => {
  it('renders log entries', () => {
    render(<ConsoleLogViewer logs={sampleLogs} />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
    expect(screen.getByText('Deprecation warning')).toBeInTheDocument();
    expect(screen.getByText('App started')).toBeInTheDocument();
  });

  it('color-codes by level', () => {
    const { container } = render(
      <ConsoleLogViewer logs={[sampleLogs[0]]} />,
    );
    const logEntry = container.querySelector('.text-red-600');
    expect(logEntry).toBeInTheDocument();
  });

  it('filter buttons toggle levels', async () => {
    const { container } = render(<ConsoleLogViewer logs={sampleLogs} />);

    expect(screen.getByText('Something failed')).toBeInTheDocument();

    const filterBar = container.querySelector('.flex.gap-1.mb-3');
    const errorButton = filterBar!.querySelector('button')!;
    await userEvent.click(errorButton);

    expect(screen.queryByText('Something failed')).not.toBeInTheDocument();
    expect(screen.getByText('Deprecation warning')).toBeInTheDocument();
  });

  it('expandable stack traces', async () => {
    render(<ConsoleLogViewer logs={sampleLogs} />);

    expect(screen.queryByText('Error: at line 42')).not.toBeInTheDocument();

    const expandButtons = screen.getAllByRole('button').filter(
      (button) => !['ERR', 'WRN', 'INF', 'LOG', 'DBG'].includes(button.textContent ?? ''),
    );
    await userEvent.click(expandButtons[0]);

    expect(screen.getByText('Error: at line 42')).toBeInTheDocument();
  });

  it('shows empty state for no logs', () => {
    render(<ConsoleLogViewer logs={[]} />);
    expect(screen.getByText('No logs to display')).toBeInTheDocument();
  });

  it('handles null logs prop', () => {
    render(<ConsoleLogViewer logs={null} />);
    expect(screen.getByText('No logs to display')).toBeInTheDocument();
  });
});
