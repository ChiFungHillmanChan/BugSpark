import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitReport } from '../src/api/report-composer';
import type { BugSparkConfig, BugReport } from '../src/types';

function createConfig(overrides: Partial<BugSparkConfig> = {}): BugSparkConfig {
  return {
    apiKey: 'test-api-key',
    endpoint: 'http://localhost:8000/api/v1',
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#e94560',
    enableScreenshot: true,
    enableConsoleLogs: true,
    enableNetworkLogs: true,
    enableSessionRecording: true,
    ...overrides,
  };
}

function createReport(overrides: Partial<BugReport> = {}): BugReport {
  return {
    title: 'Test Bug',
    description: 'Something broke',
    severity: 'medium',
    category: 'bug',
    consoleLogs: [],
    networkLogs: [],
    userActions: [],
    metadata: {
      userAgent: 'test',
      viewport: { width: 1920, height: 1080 },
      screenResolution: { width: 1920, height: 1080 },
      url: 'http://localhost',
      referrer: '',
      locale: 'en-US',
      timezone: 'UTC',
      platform: 'test',
    },
    ...overrides,
  };
}

describe('submitReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends correct payload structure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await submitReport(createConfig(), createReport());

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/reports',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
        }),
      }),
    );

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(callBody.title).toBe('Test Bug');
    expect(callBody.description).toBe('Something broke');
    expect(callBody.severity).toBe('medium');
    expect(callBody.category).toBe('bug');
  });

  it('calls upload for screenshot when present', async () => {
    const screenshotBlob = new Blob(['png-data'], { type: 'image/png' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: 'https://cdn.test/screenshot.png' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await submitReport(createConfig(), createReport({ screenshot: screenshotBlob }));

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toBe('http://localhost:8000/api/v1/upload/screenshot');
  });

  it('calls upload for annotated screenshot when present', async () => {
    const annotatedBlob = new Blob(['annotated-png'], { type: 'image/png' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: 'https://cdn.test/annotated.png' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await submitReport(createConfig(), createReport({ annotatedScreenshot: annotatedBlob }));

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toBe('http://localhost:8000/api/v1/upload/screenshot');
  });

  it('beforeSend hook can modify report', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const config = createConfig({
      beforeSend: (report) => ({ ...report, title: 'Modified Title' }),
    });

    await submitReport(config, createReport());

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(callBody.title).toBe('Modified Title');
  });

  it('beforeSend returning null cancels submission', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const config = createConfig({
      beforeSend: () => null,
    });

    await submitReport(config, createReport());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retries on network failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await submitReport(createConfig(), createReport());

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws on HTTP error response after retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    await expect(submitReport(createConfig(), createReport())).rejects.toThrow(
      '[BugSpark] Report submission failed: 404',
    );
  });
});
