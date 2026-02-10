import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock UI modules that require full DOM rendering
vi.mock('../src/ui/widget-container', () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  getRoot: vi.fn(() => document.createElement('div')),
}));

vi.mock('../src/ui/floating-button', () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
}));

vi.mock('../src/ui/report-modal', () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  setSubmitting: vi.fn(),
}));

vi.mock('../src/ui/annotation-overlay', () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

vi.mock('../src/ui/toast', () => ({
  showToast: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock('../src/core/screenshot-engine', () => ({
  captureScreenshot: vi.fn(),
}));

vi.mock('../src/core/performance-collector', () => ({
  initPerformanceObservers: vi.fn(),
  stop: vi.fn(),
}));

describe('BugSpark SDK', () => {
  let BugSpark: typeof import('../src/index').default;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../src/index');
    BugSpark = mod.default;
  });

  afterEach(() => {
    BugSpark?.destroy();
  });

  it('init() initializes without error', () => {
    expect(() => BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' })).not.toThrow();
  });

  it('init() with minimal config works', () => {
    BugSpark.init({ projectKey: 'my-key', endpoint: 'https://api.example.com' });
    expect(window.BugSpark).toBeDefined();
  });

  it('destroy() cleans up', () => {
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(() => BugSpark.destroy()).not.toThrow();
  });

  it('identify() sets user info', () => {
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(() =>
      BugSpark.identify({ id: 'user-1', email: 'a@b.com', name: 'Test' }),
    ).not.toThrow();
  });

  it('setReporter() sets reporter identifier', () => {
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(() => BugSpark.setReporter('user@example.com')).not.toThrow();
  });

  it('double init() warns and returns early', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    expect(warnSpy).toHaveBeenCalledWith('[BugSpark] Already initialized');
    warnSpy.mockRestore();
  });

  it('window.BugSpark is assigned', async () => {
    expect(window.BugSpark).toBeDefined();
    expect(typeof window.BugSpark?.init).toBe('function');
  });

  it('window.BugSpark exposes setReporter', async () => {
    expect(typeof window.BugSpark?.setReporter).toBe('function');
  });

  it('open() does not auto-capture screenshot', async () => {
    const { captureScreenshot } = await import('../src/core/screenshot-engine');
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com' });
    await BugSpark.open();

    expect(captureScreenshot).not.toHaveBeenCalled();
  });

  it('open() calls onOpen lifecycle hook', async () => {
    const onOpen = vi.fn();
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com', onOpen });
    await BugSpark.open();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('close() calls onClose lifecycle hook', async () => {
    const onClose = vi.fn();
    BugSpark.init({ projectKey: 'test-key', endpoint: 'https://api.example.com', onClose });
    await BugSpark.open();
    BugSpark.close();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
