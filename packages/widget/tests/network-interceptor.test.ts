import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NetworkInterceptor', () => {
  const mockFetch = vi.fn();
  let networkInterceptor: typeof import('../src/core/network-interceptor');

  beforeEach(async () => {
    // Install mock fetch before the module captures originalFetch
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(new Response('ok', { status: 200 }));
    window.fetch = mockFetch;

    vi.resetModules();
    networkInterceptor = await import('../src/core/network-interceptor');
  });

  afterEach(() => {
    networkInterceptor.stop();
    networkInterceptor.clear();
  });

  it('start() patches fetch', () => {
    const fetchBefore = window.fetch;
    networkInterceptor.start('http://bugspark.test');
    expect(window.fetch).not.toBe(fetchBefore);
  });

  it('stop() restores fetch so it is no longer the patched version', () => {
    networkInterceptor.start('http://bugspark.test');
    const patchedFetch = window.fetch;
    networkInterceptor.stop();
    expect(window.fetch).not.toBe(patchedFetch);
    // After stop, new calls should not be captured
    networkInterceptor.clear();
  });

  it('captures fetch requests with method/url/status/duration', async () => {
    networkInterceptor.start('http://bugspark.test');

    await window.fetch('https://api.example.com/data', { method: 'POST' });

    const entries = networkInterceptor.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe('POST');
    expect(entries[0].url).toBe('https://api.example.com/data');
    expect(entries[0].status).toBe(200);
    expect(entries[0].duration).toBeGreaterThanOrEqual(0);
  });

  it('ring buffer limits to 50 entries', async () => {
    networkInterceptor.start('http://bugspark.test');

    for (let i = 0; i < 60; i++) {
      await window.fetch(`https://api.example.com/item/${i}`);
    }

    const entries = networkInterceptor.getEntries();
    expect(entries).toHaveLength(50);
    expect(entries[0].url).toBe('https://api.example.com/item/10');
  });

  it('filters out BugSpark endpoint requests', async () => {
    networkInterceptor.start('http://bugspark.test');

    await window.fetch('http://bugspark.test/api/reports');
    await window.fetch('https://other-api.com/data');

    const entries = networkInterceptor.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe('https://other-api.com/data');
  });

  it('getEntries() returns a copy and clear() works', () => {
    networkInterceptor.start('http://bugspark.test');
    const entries1 = networkInterceptor.getEntries();
    const entries2 = networkInterceptor.getEntries();
    expect(entries1).not.toBe(entries2);

    networkInterceptor.clear();
    expect(networkInterceptor.getEntries()).toHaveLength(0);
  });
});
