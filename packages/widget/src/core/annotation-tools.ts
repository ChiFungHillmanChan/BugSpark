import type { AnnotationShape } from '../types';

export interface ToolPointerEvent {
  x: number;
  y: number;
}

export interface AnnotationTool {
  onPointerDown(event: ToolPointerEvent): void;
  onPointerMove(event: ToolPointerEvent): void;
  onPointerUp(event: ToolPointerEvent): AnnotationShape | null;
  render(ctx: CanvasRenderingContext2D): void;
}

export function createPenTool(color: string, lineWidth: number): AnnotationTool {
  let points: Array<{ x: number; y: number }> = [];
  let isDrawing = false;

  return {
    onPointerDown(event) {
      isDrawing = true;
      points = [{ x: event.x, y: event.y }];
    },
    onPointerMove(event) {
      if (!isDrawing) return;
      points.push({ x: event.x, y: event.y });
    },
    onPointerUp() {
      if (!isDrawing) return null;
      isDrawing = false;
      if (points.length < 2) return null;
      const shape: AnnotationShape = {
        type: 'pen',
        color,
        lineWidth,
        points: [...points],
      };
      points = [];
      return shape;
    },
    render(ctx) {
      if (points.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    },
  };
}

export function createArrowTool(color: string, lineWidth: number): AnnotationTool {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let isDrawing = false;

  function renderArrow(ctx: CanvasRenderingContext2D, sx: number, sy: number, ex: number, ey: number): void {
    const headLength = Math.max(lineWidth * 4, 12);
    const angle = Math.atan2(ey - sy, ex - sx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(
      ex - headLength * Math.cos(angle - Math.PI / 6),
      ey - headLength * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      ex - headLength * Math.cos(angle + Math.PI / 6),
      ey - headLength * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }

  return {
    onPointerDown(event) {
      isDrawing = true;
      startX = event.x;
      startY = event.y;
      endX = event.x;
      endY = event.y;
    },
    onPointerMove(event) {
      if (!isDrawing) return;
      endX = event.x;
      endY = event.y;
    },
    onPointerUp() {
      if (!isDrawing) return null;
      isDrawing = false;
      const shape: AnnotationShape = {
        type: 'arrow',
        color,
        lineWidth,
        startX,
        startY,
        endX,
        endY,
      };
      return shape;
    },
    render(ctx) {
      if (!isDrawing) return;
      renderArrow(ctx, startX, startY, endX, endY);
    },
  };
}

export function createRectangleTool(color: string, lineWidth: number): AnnotationTool {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let isDrawing = false;

  return {
    onPointerDown(event) {
      isDrawing = true;
      startX = event.x;
      startY = event.y;
      endX = event.x;
      endY = event.y;
    },
    onPointerMove(event) {
      if (!isDrawing) return;
      endX = event.x;
      endY = event.y;
    },
    onPointerUp() {
      if (!isDrawing) return null;
      isDrawing = false;
      return { type: 'rectangle', color, lineWidth, startX, startY, endX, endY } as AnnotationShape;
    },
    render(ctx) {
      if (!isDrawing) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    },
  };
}

export function createCircleTool(color: string, lineWidth: number): AnnotationTool {
  let centerX = 0;
  let centerY = 0;
  let currentRadius = 0;
  let isDrawing = false;

  return {
    onPointerDown(event) {
      isDrawing = true;
      centerX = event.x;
      centerY = event.y;
      currentRadius = 0;
    },
    onPointerMove(event) {
      if (!isDrawing) return;
      const dx = event.x - centerX;
      const dy = event.y - centerY;
      currentRadius = Math.sqrt(dx * dx + dy * dy);
    },
    onPointerUp() {
      if (!isDrawing) return null;
      isDrawing = false;
      return {
        type: 'circle',
        color,
        lineWidth,
        startX: centerX,
        startY: centerY,
        radius: currentRadius,
      } as AnnotationShape;
    },
    render(ctx) {
      if (!isDrawing || currentRadius <= 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
}
