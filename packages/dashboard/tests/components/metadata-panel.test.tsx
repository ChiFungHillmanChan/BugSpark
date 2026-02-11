import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../test-utils';
import { MetadataPanel } from '@/components/bug-detail/metadata-panel';

describe('MetadataPanel', () => {
  it('renders metadata key-value pairs', () => {
    renderWithIntl(
      <MetadataPanel metadata={{ userAgent: 'Chrome/120', platform: 'macOS' }} />,
    );
    expect(screen.getByText('User Agent')).toBeInTheDocument();
    expect(screen.getByText('Chrome/120')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('macOS')).toBeInTheDocument();
  });

  it('handles null metadata', () => {
    renderWithIntl(<MetadataPanel metadata={null} />);
    expect(screen.getByText('No device metadata')).toBeInTheDocument();
  });

  it('formats viewport object as "width x height"', () => {
    renderWithIntl(
      <MetadataPanel metadata={{ viewport: { width: 1920, height: 1080 } }} />,
    );
    expect(screen.getByText('1920 x 1080')).toBeInTheDocument();
  });

  it('shows "N/A" for missing values', () => {
    renderWithIntl(<MetadataPanel metadata={{ userAgent: null }} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders extra keys not in predefined list', () => {
    renderWithIntl(
      <MetadataPanel metadata={{ customField: 'custom-value' }} />,
    );
    expect(screen.getByText('custom-value')).toBeInTheDocument();
  });
});
