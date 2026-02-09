import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataPanel } from '@/components/bug-detail/metadata-panel';

describe('MetadataPanel', () => {
  it('renders metadata key-value pairs', () => {
    render(
      <MetadataPanel metadata={{ userAgent: 'Chrome/120', platform: 'macOS' }} />,
    );
    expect(screen.getByText('User Agent')).toBeInTheDocument();
    expect(screen.getByText('Chrome/120')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('macOS')).toBeInTheDocument();
  });

  it('handles null metadata', () => {
    render(<MetadataPanel metadata={null} />);
    expect(screen.getByText('No device metadata')).toBeInTheDocument();
  });

  it('formats viewport object as "width x height"', () => {
    render(
      <MetadataPanel metadata={{ viewport: { width: 1920, height: 1080 } }} />,
    );
    expect(screen.getByText('1920 x 1080')).toBeInTheDocument();
  });

  it('shows "N/A" for missing values', () => {
    render(<MetadataPanel metadata={{ userAgent: null }} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders extra keys not in predefined list', () => {
    render(
      <MetadataPanel metadata={{ customField: 'custom-value' }} />,
    );
    expect(screen.getByText('custom-value')).toBeInTheDocument();
  });
});
