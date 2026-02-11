import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as annotationCanvas from '../src/core/annotation-canvas';
import * as annotationHistory from '../src/core/annotation-history';

// jsdom does not provide PointerEvent — polyfill it from MouseEvent
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.pointerType = params.pointerType ?? '';
      this.isPrimary = params.isPrimary ?? false;
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const mockCtx = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
    putImageData: vi.fn(),
    font: '',
  };

  vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: width, bottom: height,
    width, height, x: 0, y: 0, toJSON: vi.fn(),
  });

  return canvas;
}

function createMockScreenshot(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,mock');
  return canvas;
}

function createPointerEvent(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
  });
}

describe('AnnotationCanvas', () => {
  let drawCanvas: HTMLCanvasElement;
  let screenshotCanvas: HTMLCanvasElement;
  let textInputHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    drawCanvas = createMockCanvas();
    screenshotCanvas = createMockScreenshot();
    textInputHandler = vi.fn();

    // Mock Image loading
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      const img = { src: '', onload: null as (() => void) | null } as unknown as HTMLImageElement;
      setTimeout(() => {
        if (img.onload) img.onload();
      }, 0);
      return img;
    });

    // Mock requestAnimationFrame
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(cb, 16) as unknown as number;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    annotationCanvas.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('init()', () => {
    it('sets canvas dimensions to match screenshot', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      expect(drawCanvas.width).toBe(screenshotCanvas.width);
      expect(drawCanvas.height).toBe(screenshotCanvas.height);
    });

    it('registers pointer event listeners', () => {
      const addSpy = vi.spyOn(drawCanvas, 'addEventListener');
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);

      expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
    });

    it('clears annotation history on init', () => {
      annotationHistory.push({
        type: 'rectangle',
        color: '#ff0000',
        lineWidth: 2,
        startX: 0,
        startY: 0,
      });
      expect(annotationHistory.getAll()).toHaveLength(1);

      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      expect(annotationHistory.getAll()).toHaveLength(0);
    });
  });

  describe('pointer events and drawing', () => {
    it('creates shape on pointer down, move, up sequence', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointermove', 100, 100));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      expect(annotationHistory.getAll()).toHaveLength(1);
      expect(annotationHistory.getAll()[0].type).toBe('rectangle');
    });

    it('pen tool captures multiple points', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('pen');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointermove', 50, 50));
      drawCanvas.dispatchEvent(createPointerEvent('pointermove', 100, 100));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      const shapes = annotationHistory.getAll();
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe('pen');
      expect(shapes[0].points?.length).toBeGreaterThanOrEqual(2);
    });

    it('arrow tool creates shape with start and end coordinates', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('arrow');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 20));
      drawCanvas.dispatchEvent(createPointerEvent('pointermove', 200, 300));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 200, 300));

      const shapes = annotationHistory.getAll();
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe('arrow');
    });

    it('circle tool creates shape with radius', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('circle');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
      drawCanvas.dispatchEvent(createPointerEvent('pointermove', 150, 100));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 150, 100));

      const shapes = annotationHistory.getAll();
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe('circle');
      expect(shapes[0].radius).toBeGreaterThan(0);
    });
  });

  describe('setTool()', () => {
    it('changes the active tool', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('arrow');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      expect(annotationHistory.getAll()[0].type).toBe('arrow');
    });
  });

  describe('setColor()', () => {
    it('applies color to subsequent shapes', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');
      annotationCanvas.setColor('#00ff00');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      expect(annotationHistory.getAll()[0].color).toBe('#00ff00');
    });
  });

  describe('setLineWidth()', () => {
    it('applies line width to subsequent shapes', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');
      annotationCanvas.setLineWidth(8);

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      expect(annotationHistory.getAll()[0].lineWidth).toBe(8);
    });
  });

  describe('getLineWidth()', () => {
    it('returns current line width', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setLineWidth(5);
      expect(annotationCanvas.getLineWidth()).toBe(5);
    });
  });

  describe('undo()', () => {
    it('removes the last shape', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));
      expect(annotationHistory.getAll()).toHaveLength(1);

      annotationCanvas.undo();
      expect(annotationHistory.getAll()).toHaveLength(0);
    });
  });

  describe('redo()', () => {
    it('restores the last undone shape', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      annotationCanvas.undo();
      expect(annotationHistory.getAll()).toHaveLength(0);

      annotationCanvas.redo();
      expect(annotationHistory.getAll()).toHaveLength(1);
    });
  });

  describe('destroy()', () => {
    it('removes pointer event listeners', () => {
      const removeSpy = vi.spyOn(drawCanvas, 'removeEventListener');
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.destroy();

      expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
    });

    it('clears history on destroy', () => {
      annotationCanvas.init(drawCanvas, screenshotCanvas, textInputHandler);
      annotationCanvas.setTool('rectangle');

      drawCanvas.dispatchEvent(createPointerEvent('pointerdown', 10, 10));
      drawCanvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      annotationCanvas.destroy();
      expect(annotationHistory.getAll()).toHaveLength(0);
    });
  });
});
