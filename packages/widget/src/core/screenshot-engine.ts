import html2canvas from 'html2canvas-pro';

const SCREENSHOT_TIMEOUT_MS = 10000;

function createFallbackCanvas(): HTMLCanvasElement {
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = window.innerWidth * window.devicePixelRatio;
  fallbackCanvas.height = window.innerHeight * window.devicePixelRatio;
  const ctx = fallbackCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Screenshot capture failed',
      fallbackCanvas.width / 2,
      fallbackCanvas.height / 2,
    );
  }
  return fallbackCanvas;
}

export async function captureScreenshot(): Promise<HTMLCanvasElement> {
  try {
    const canvas = await Promise.race([
      html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: window.devicePixelRatio,
        ignoreElements: (element: Element) => {
          return element.id === 'bugspark-host';
        },
      }),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Screenshot capture timed out')), SCREENSHOT_TIMEOUT_MS),
      ),
    ]);
    return canvas;
  } catch (error) {
    console.error('[BugSpark] Screenshot capture failed:', error);
    return createFallbackCanvas();
  }
}
