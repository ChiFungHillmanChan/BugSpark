import { describe, it, expect } from 'vitest';
import { mergeConfig } from '../src/config';

describe('mergeConfig', () => {
  it('returns config with defaults when given projectKey and endpoint', () => {
    const result = mergeConfig({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(result.projectKey).toBe('test-key');
    expect(result.endpoint).toBe('https://api.example.com');
    expect(result.position).toBe('bottom-right');
    expect(result.theme).toBe('light');
    expect(result.primaryColor).toBe('#e94560');
    expect(result.enableScreenshot).toBe(true);
    expect(result.collectConsole).toBe(true);
    expect(result.collectNetwork).toBe(true);
    expect(result.enableSessionRecording).toBe(false);
    expect(result.maxConsoleLogs).toBe(50);
    expect(result.maxNetworkLogs).toBe(30);
  });

  it('merges user-provided options with defaults', () => {
    const result = mergeConfig({
      projectKey: 'key-123',
      endpoint: 'https://custom.api.com',
      position: 'top-left',
      theme: 'dark',
      primaryColor: '#ff0000',
      enableScreenshot: false,
      collectConsole: false,
      collectNetwork: false,
      enableSessionRecording: false,
    });
    expect(result.projectKey).toBe('key-123');
    expect(result.endpoint).toBe('https://custom.api.com');
    expect(result.position).toBe('top-left');
    expect(result.theme).toBe('dark');
    expect(result.primaryColor).toBe('#ff0000');
    expect(result.enableScreenshot).toBe(false);
    expect(result.collectConsole).toBe(false);
    expect(result.collectNetwork).toBe(false);
    expect(result.enableSessionRecording).toBe(false);
  });

  it('throws when projectKey is missing', () => {
    expect(() => mergeConfig({})).toThrow('[BugSpark] projectKey is required');
  });

  it('throws when projectKey is empty string', () => {
    expect(() => mergeConfig({ projectKey: '' })).toThrow('[BugSpark] projectKey is required');
  });

  it('throws when endpoint is missing', () => {
    expect(() => mergeConfig({ projectKey: 'test-key' })).toThrow('[BugSpark] endpoint is required');
  });

  it('throws when endpoint is empty string', () => {
    expect(() => mergeConfig({ projectKey: 'test-key', endpoint: '' })).toThrow('[BugSpark] endpoint is required');
  });

  it('throws when endpoint does not start with http:// or https://', () => {
    expect(() => mergeConfig({ projectKey: 'test-key', endpoint: 'ftp://bad.com' })).toThrow(
      '[BugSpark] endpoint must start with https:// or http://',
    );
  });

  it('accepts endpoint starting with http://', () => {
    const result = mergeConfig({ projectKey: 'test-key', endpoint: 'http://localhost:8000' });
    expect(result.endpoint).toBe('http://localhost:8000');
  });

  it('accepts endpoint starting with https://', () => {
    const result = mergeConfig({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(result.endpoint).toBe('https://api.example.com');
  });

  it('supports deprecated apiKey as fallback for projectKey', () => {
    const result = mergeConfig({ apiKey: 'legacy-key', endpoint: 'https://api.example.com' });
    expect(result.projectKey).toBe('legacy-key');
  });

  it('prefers projectKey over deprecated apiKey', () => {
    const result = mergeConfig({ projectKey: 'new-key', apiKey: 'old-key', endpoint: 'https://api.example.com' });
    expect(result.projectKey).toBe('new-key');
  });

  it('supports deprecated enableConsoleLogs as fallback for collectConsole', () => {
    const result = mergeConfig({ projectKey: 'key', endpoint: 'https://api.example.com', enableConsoleLogs: false });
    expect(result.collectConsole).toBe(false);
  });

  it('supports deprecated enableNetworkLogs as fallback for collectNetwork', () => {
    const result = mergeConfig({ projectKey: 'key', endpoint: 'https://api.example.com', enableNetworkLogs: false });
    expect(result.collectNetwork).toBe(false);
  });

  it('prefers collectConsole over deprecated enableConsoleLogs', () => {
    const result = mergeConfig({ projectKey: 'key', endpoint: 'https://api.example.com', collectConsole: false, enableConsoleLogs: true });
    expect(result.collectConsole).toBe(false);
  });

  it('allows custom maxConsoleLogs and maxNetworkLogs', () => {
    const result = mergeConfig({ projectKey: 'key', endpoint: 'https://api.example.com', maxConsoleLogs: 200, maxNetworkLogs: 100 });
    expect(result.maxConsoleLogs).toBe(200);
    expect(result.maxNetworkLogs).toBe(100);
  });
});
