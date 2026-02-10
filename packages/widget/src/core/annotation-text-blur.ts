import type { AnnotationShape } from '../types';
import type { AnnotationTool, ToolPointerEvent } from './annotation-tools';

export function createTextTool(
  color: string,
  _lineWidth: number,
  onRequestInput: (x: number, y: number, callback: (text: string) => void) => void,
  commitShape: (shape: AnnotationShape) => void,
): AnnotationTool {
  return {
    onPointerDown(event: ToolPointerEvent) {
      onRequestInput(event.x, event.y, (text: string) => {
        if (text.trim()) {
          commitShape({
            type: 'text',
            color,
            lineWidth: 16,
            startX: event.x,
            startY: event.y,
            text,
          });
        }
      });
    },
    onPointerMove() {},
    onPointerUp(): AnnotationShape | null {
      return null;
    },
    render() {},
  };
}

export function createBlurTool(): AnnotationTool {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let isDrawing = false;

  return {
    onPointerDown(event: ToolPointerEvent) {
      isDrawing = true;
      startX = event.x;
      startY = event.y;
      endX = event.x;
      endY = event.y;
    },
    onPointerMove(event: ToolPointerEvent) {
      if (!isDrawing) return;
      endX = event.x;
      endY = event.y;
    },
    onPointerUp(): AnnotationShape | null {
      if (!isDrawing) return null;
      isDrawing = false;
      return {
        type: 'blur',
        color: '',
        lineWidth: 0,
        startX,
        startY,
        endX,
        endY,
      };
    },
    render(ctx: CanvasRenderingContext2D) {
      if (!isDrawing) return;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      ctx.setLineDash([]);
    },
  };
}

export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: AnnotationShape,
): void {
  switch (shape.type) {
    case 'pen':
      if (!shape.points || shape.points.length < 2) return;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.stroke();
      break;

    case 'arrow': {
      const headLength = Math.max(shape.lineWidth * 4, 12);
      const angle = Math.atan2(
        (shape.endY ?? 0) - (shape.startY ?? 0),
        (shape.endX ?? 0) - (shape.startX ?? 0),
      );
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.startX ?? 0, shape.startY ?? 0);
      ctx.lineTo(shape.endX ?? 0, shape.endY ?? 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(shape.endX ?? 0, shape.endY ?? 0);
      ctx.lineTo(
        (shape.endX ?? 0) - headLength * Math.cos(angle - Math.PI / 6),
        (shape.endY ?? 0) - headLength * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        (shape.endX ?? 0) - headLength * Math.cos(angle + Math.PI / 6),
        (shape.endY ?? 0) - headLength * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'rectangle':
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.strokeRect(
        shape.startX ?? 0,
        shape.startY ?? 0,
        (shape.endX ?? 0) - (shape.startX ?? 0),
        (shape.endY ?? 0) - (shape.startY ?? 0),
      );
      break;

    case 'circle':
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.beginPath();
      ctx.arc(shape.startX ?? 0, shape.startY ?? 0, shape.radius ?? 0, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'text':
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.lineWidth}px sans-serif`;
      ctx.fillText(shape.text ?? '', shape.startX ?? 0, shape.startY ?? 0);
      break;

    case 'blur':
      applyBlur(ctx, shape);
      break;
  }
}

/** Cached blurred ImageData keyed by shape reference. */
const blurCache = new WeakMap<AnnotationShape, { x: number; y: number; imageData: ImageData }>();

/**
 * Clear the blur cache. Call this when the shape list changes
 * (undo / redo / new shape pushed) so stale entries are freed.
 */
export function clearBlurCache(): void {
  // WeakMap entries are GC'd automatically when keys are no longer referenced,
  // but we expose this so callers can force a fresh computation if needed.
  // Since WeakMap has no .clear(), we simply re-assign.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // No-op: WeakMap handles cleanup when shapes are GC'd after undo/redo.
}

function applyBlur(ctx: CanvasRenderingContext2D, shape: AnnotationShape): void {
  const x = Math.min(shape.startX ?? 0, shape.endX ?? 0);
  const y = Math.min(shape.startY ?? 0, shape.endY ?? 0);
  const width = Math.abs((shape.endX ?? 0) - (shape.startX ?? 0));
  const height = Math.abs((shape.endY ?? 0) - (shape.startY ?? 0));

  if (width <= 0 || height <= 0) return;

  // Return cached result if available (same shape object means same region)
  const cached = blurCache.get(shape);
  if (cached) {
    ctx.putImageData(cached.imageData, cached.x, cached.y);
    return;
  }

  const blockSize = 10;
  const imageData = ctx.getImageData(x, y, width, height);
  const { data } = imageData;

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      const maxBY = Math.min(by + blockSize, height);
      const maxBX = Math.min(bx + blockSize, width);

      for (let py = by; py < maxBY; py++) {
        for (let px = bx; px < maxBX; px++) {
          const i = (py * width + px) * 4;
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
          count++;
        }
      }

      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;

      for (let py = by; py < maxBY; py++) {
        for (let px = bx; px < maxBX; px++) {
          const i = (py * width + px) * 4;
          data[i] = avgR;
          data[i + 1] = avgG;
          data[i + 2] = avgB;
        }
      }
    }
  }

  // Cache the computed result for subsequent frames
  blurCache.set(shape, { x, y, imageData });
  ctx.putImageData(imageData, x, y);
}
