import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('html2canvas-pro', () => ({
  default: vi.fn(),
}));

import { captureScreenshot } from '../src/core/screenshot-engine';
import html2canvas from 'html2canvas-pro';

const mockHtml2canvas = vi.mocked(html2canvas);

describe('captureScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns canvas from html2canvas on success', async () => {
    const fakeCanvas = document.createElement('canvas');
    fakeCanvas.width = 800;
    fakeCanvas.height = 600;
    mockHtml2canvas.mockResolvedValueOnce(fakeCanvas);

    const result = await captureScreenshot();

    expect(result).toBe(fakeCanvas);
    expect(mockHtml2canvas).toHaveBeenCalledOnce();
  });

  it('returns fallback canvas when html2canvas throws', async () => {
    mockHtml2canvas.mockRejectedValueOnce(new Error('render failed'));

    const result = await captureScreenshot();

    expect(result).toBeInstanceOf(HTMLCanvasElement);
    expect(result.width).toBe(window.innerWidth * window.devicePixelRatio);
    expect(result.height).toBe(window.innerHeight * window.devicePixelRatio);
  });

  it('returns fallback canvas on timeout', async () => {
    vi.useFakeTimers();

    mockHtml2canvas.mockImplementation(
      () => new Promise(() => {/* never resolves */}),
    );

    const promise = captureScreenshot();
    vi.advanceTimersByTime(10000);

    const result = await promise;

    expect(result).toBeInstanceOf(HTMLCanvasElement);
    expect(result.width).toBe(window.innerWidth * window.devicePixelRatio);
  });
});
