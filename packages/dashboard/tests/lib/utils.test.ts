import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for recent dates', () => {
    const tenSecondsAgo = new Date('2025-06-15T11:59:50Z').toISOString();
    expect(formatDate(tenSecondsAgo)).toBe('just now');
  });

  it('returns "Xm ago" for minutes', () => {
    const fiveMinutesAgo = new Date('2025-06-15T11:55:00Z').toISOString();
    expect(formatDate(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns "Xh ago" for hours', () => {
    const threeHoursAgo = new Date('2025-06-15T09:00:00Z').toISOString();
    expect(formatDate(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Xd ago" for days', () => {
    const twoDaysAgo = new Date('2025-06-13T12:00:00Z').toISOString();
    expect(formatDate(twoDaysAgo)).toBe('2d ago');
  });

  it('returns full date for old dates (30+ days)', () => {
    const oldDate = new Date('2025-01-01T00:00:00Z').toISOString();
    const result = formatDate(oldDate);
    expect(result).not.toContain('ago');
    expect(result).not.toBe('just now');
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
