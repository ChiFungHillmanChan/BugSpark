import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDuration, severityColor, statusColor } from '@/lib/utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });
});

describe('formatDate', () => {
  it('formats date as "d Mon YYYY HH:MM"', () => {
    const result = formatDate('2026-02-13T13:38:00Z');
    // Date is rendered in local timezone; check structure
    expect(result).toMatch(/^\d{1,2} \w{3} \d{4} \d{2}:\d{2}$/);
  });

  it('uses short month name', () => {
    const result = formatDate('2025-06-15T12:00:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('2025');
  });

  it('pads hours and minutes with leading zeros', () => {
    const result = formatDate('2025-01-05T03:07:00Z');
    // In UTC the time is 03:07; local may differ but format is always HH:MM
    expect(result).toMatch(/\d{2}:\d{2}$/);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(7500000)).toBe('2h 5m');
  });
});

describe('severityColor', () => {
  it('returns correct class for critical', () => {
    expect(severityColor('critical')).toContain('text-severity-critical');
  });

  it('returns correct class for high', () => {
    expect(severityColor('high')).toContain('text-severity-high');
  });

  it('returns correct class for medium', () => {
    expect(severityColor('medium')).toContain('text-severity-medium');
  });

  it('returns correct class for low', () => {
    expect(severityColor('low')).toContain('text-severity-low');
  });
});

describe('statusColor', () => {
  it('returns correct class for new', () => {
    expect(statusColor('new')).toContain('text-status-new');
  });

  it('returns correct class for triaging', () => {
    expect(statusColor('triaging')).toContain('text-status-triaging');
  });

  it('returns correct class for in_progress', () => {
    expect(statusColor('in_progress')).toContain('text-status-in-progress');
  });

  it('returns correct class for resolved', () => {
    expect(statusColor('resolved')).toContain('text-status-resolved');
  });

  it('returns correct class for closed', () => {
    expect(statusColor('closed')).toContain('text-status-closed');
  });
});
