import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../test-utils';
import { SeverityBadge } from '@/components/bugs/severity-badge';
import type { Severity } from '@/types';

describe('SeverityBadge', () => {
  const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
  const labels: Record<Severity, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  it.each(severities)('renders severity text for "%s"', (severity) => {
    renderWithIntl(<SeverityBadge severity={severity} />);
    expect(screen.getByText(labels[severity])).toBeInTheDocument();
  });

  it('applies correct color class for critical', () => {
    const { container } = renderWithIntl(<SeverityBadge severity="critical" />);
    expect(container.firstChild).toHaveClass('text-severity-critical');
  });

  it('applies correct color class for high', () => {
    const { container } = renderWithIntl(<SeverityBadge severity="high" />);
    expect(container.firstChild).toHaveClass('text-severity-high');
  });

  it('applies correct color class for medium', () => {
    const { container } = renderWithIntl(<SeverityBadge severity="medium" />);
    expect(container.firstChild).toHaveClass('text-severity-medium');
  });

  it('applies correct color class for low', () => {
    const { container } = renderWithIntl(<SeverityBadge severity="low" />);
    expect(container.firstChild).toHaveClass('text-severity-low');
  });
});
