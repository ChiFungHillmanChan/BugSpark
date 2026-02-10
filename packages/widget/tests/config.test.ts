import { describe, it, expect } from 'vitest';
import { mergeConfig } from '../src/config';

describe('mergeConfig', () => {
  it('returns config with defaults when given apiKey and endpoint', () => {
    const result = mergeConfig({ apiKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(result.apiKey).toBe('test-key');
    expect(result.endpoint).toBe('https://api.example.com');
    expect(result.position).toBe('bottom-right');
    expect(result.theme).toBe('light');
    expect(result.primaryColor).toBe('#e94560');
    expect(result.enableScreenshot).toBe(true);
    expect(result.enableConsoleLogs).toBe(true);
    expect(result.enableNetworkLogs).toBe(true);
    expect(result.enableSessionRecording).toBe(false);
  });

  it('merges user-provided options with defaults', () => {
    const result = mergeConfig({
      apiKey: 'key-123',
      endpoint: 'https://custom.api.com',
      position: 'top-left',
      theme: 'dark',
      primaryColor: '#ff0000',
      enableScreenshot: false,
      enableConsoleLogs: false,
      enableNetworkLogs: false,
      enableSessionRecording: false,
    });
    expect(result.apiKey).toBe('key-123');
    expect(result.endpoint).toBe('https://custom.api.com');
    expect(result.position).toBe('top-left');
    expect(result.theme).toBe('dark');
    expect(result.primaryColor).toBe('#ff0000');
    expect(result.enableScreenshot).toBe(false);
    expect(result.enableConsoleLogs).toBe(false);
    expect(result.enableNetworkLogs).toBe(false);
    expect(result.enableSessionRecording).toBe(false);
  });

  it('throws when apiKey is missing', () => {
    expect(() => mergeConfig({})).toThrow('[BugSpark] apiKey is required');
  });

  it('throws when apiKey is empty string', () => {
    expect(() => mergeConfig({ apiKey: '' })).toThrow('[BugSpark] apiKey is required');
  });

  it('throws when endpoint is missing', () => {
    expect(() => mergeConfig({ apiKey: 'test-key' })).toThrow('[BugSpark] endpoint is required');
  });

  it('throws when endpoint is empty string', () => {
    expect(() => mergeConfig({ apiKey: 'test-key', endpoint: '' })).toThrow('[BugSpark] endpoint is required');
  });

  it('throws when endpoint does not start with http:// or https://', () => {
    expect(() => mergeConfig({ apiKey: 'test-key', endpoint: 'ftp://bad.com' })).toThrow(
      '[BugSpark] endpoint must start with https:// or http://',
    );
  });

  it('accepts endpoint starting with http://', () => {
    const result = mergeConfig({ apiKey: 'test-key', endpoint: 'http://localhost:8000' });
    expect(result.endpoint).toBe('http://localhost:8000');
  });

  it('accepts endpoint starting with https://', () => {
    const result = mergeConfig({ apiKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(result.endpoint).toBe('https://api.example.com');
  });
});
