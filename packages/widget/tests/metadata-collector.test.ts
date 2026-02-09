import { describe, it, expect } from 'vitest';
import { collectMetadata } from '../src/core/metadata-collector';

describe('collectMetadata', () => {
  it('returns all expected fields', () => {
    const metadata = collectMetadata();
    expect(metadata).toHaveProperty('userAgent');
    expect(metadata).toHaveProperty('viewport');
    expect(metadata).toHaveProperty('screenResolution');
    expect(metadata).toHaveProperty('url');
    expect(metadata).toHaveProperty('locale');
    expect(metadata).toHaveProperty('timezone');
    expect(metadata).toHaveProperty('platform');
    expect(metadata).toHaveProperty('referrer');
  });

  it('returns userAgent as a string', () => {
    const metadata = collectMetadata();
    expect(typeof metadata.userAgent).toBe('string');
  });

  it('returns viewport with width and height', () => {
    const metadata = collectMetadata();
    expect(metadata.viewport).toHaveProperty('width');
    expect(metadata.viewport).toHaveProperty('height');
    expect(typeof metadata.viewport.width).toBe('number');
    expect(typeof metadata.viewport.height).toBe('number');
  });

  it('returns screenResolution with width and height', () => {
    const metadata = collectMetadata();
    expect(metadata.screenResolution).toHaveProperty('width');
    expect(metadata.screenResolution).toHaveProperty('height');
  });

  it('returns url, locale, timezone, and platform as strings', () => {
    const metadata = collectMetadata();
    expect(typeof metadata.url).toBe('string');
    expect(typeof metadata.locale).toBe('string');
    expect(typeof metadata.timezone).toBe('string');
    expect(typeof metadata.platform).toBe('string');
  });

  it('handles missing navigator.connection gracefully', () => {
    const metadata = collectMetadata();
    // connection is optional, should not throw
    expect(metadata.connection === undefined || typeof metadata.connection === 'string').toBe(true);
  });
});
