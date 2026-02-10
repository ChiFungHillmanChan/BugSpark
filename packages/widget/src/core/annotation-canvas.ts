import type { AnnotationShape, AnnotationToolType } from '../types';
import type { AnnotationTool } from './annotation-tools';
import {
  createPenTool,
  createArrowTool,
  createRectangleTool,
  createCircleTool,
} from './annotation-tools';
import { createTextTool, createBlurTool, renderShape } from './annotation-text-blur';
import * as history from './annotation-history';

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let screenshotImage: HTMLImageElement | null = null;
let currentTool: AnnotationTool | null = null;
let currentToolType: AnnotationToolType = 'none';
let currentColor = '#e94560';
let currentLineWidth = 3;
let animationFrameId: number | null = null;
let isPointerDown = false;
let onRequestTextInput: ((x: number, y: number, cb: (text: string) => void) => void) | null = null;

function getCanvasCoords(event: PointerEvent): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function createToolInstance(): AnnotationTool | null {
  switch (currentToolType) {
    case 'pen': return createPenTool(currentColor, currentLineWidth);
    case 'arrow': return createArrowTool(currentColor, currentLineWidth);
    case 'rectangle': return createRectangleTool(currentColor, currentLineWidth);
    case 'circle': return createCircleTool(currentColor, currentLineWidth);
    case 'text':
      return createTextTool(currentColor, currentLineWidth, (x, y, cb) => {
        onRequestTextInput?.(x, y, cb);
      }, (shape) => {
        history.push(shape);
      });
    case 'blur': return createBlurTool();
    default: return null;
  }
}

function renderLoop(): void {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (screenshotImage) {
    ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
  }

  for (const shape of history.getAll()) {
    renderShape(ctx, shape);
  }

  currentTool?.render(ctx);

  animationFrameId = requestAnimationFrame(renderLoop);
}

function handlePointerDown(event: PointerEvent): void {
  if (!currentTool) {
    currentTool = createToolInstance();
  }
  if (!currentTool) return;
  isPointerDown = true;
  const coords = getCanvasCoords(event);
  currentTool.onPointerDown(coords);
}

function handlePointerMove(event: PointerEvent): void {
  if (!isPointerDown || !currentTool) return;
  const coords = getCanvasCoords(event);
  currentTool.onPointerMove(coords);
}

function handlePointerUp(event: PointerEvent): void {
  if (!currentTool) return;
  isPointerDown = false;
  const coords = getCanvasCoords(event);
  const shape = currentTool.onPointerUp(coords);
  if (shape) {
    history.push(shape);
  }
  currentTool = createToolInstance();
}

export function init(
  targetCanvas: HTMLCanvasElement,
  screenshot: HTMLCanvasElement,
  textInputHandler: (x: number, y: number, cb: (text: string) => void) => void,
): void {
  canvas = targetCanvas;
  ctx = canvas.getContext('2d');
  onRequestTextInput = textInputHandler;

  canvas.width = screenshot.width;
  canvas.height = screenshot.height;

  screenshotImage = new Image();
  screenshotImage.src = screenshot.toDataURL();
  screenshotImage.onload = () => {
    renderLoop();
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);

  history.clear();
}

export function setTool(tool: AnnotationToolType): void {
  currentToolType = tool;
  currentTool = createToolInstance();
}

export function setColor(color: string): void {
  currentColor = color;
  currentTool = createToolInstance();
}

export function setLineWidth(width: number): void {
  currentLineWidth = width;
  currentTool = createToolInstance();
}

export function getLineWidth(): number {
  return currentLineWidth;
}

export function undo(): void {
  history.undo();
}

export function redo(): void {
  history.redo();
}

export function getAnnotatedCanvas(): HTMLCanvasElement {
  if (!canvas) throw new Error('[BugSpark] Annotation canvas not initialized');
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const outputCtx = outputCanvas.getContext('2d')!;

  if (screenshotImage) {
    outputCtx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
  }
  for (const shape of history.getAll()) {
    renderShape(outputCtx, shape);
  }

  return outputCanvas;
}

export function destroy(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (canvas) {
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerUp);
  }
  canvas = null;
  ctx = null;
  screenshotImage = null;
  currentTool = null;
  history.clear();
}
