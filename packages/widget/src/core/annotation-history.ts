import type { AnnotationShape } from '../types';

let undoStack: AnnotationShape[] = [];
let redoStack: AnnotationShape[] = [];

export function push(shape: AnnotationShape): void {
  undoStack.push(shape);
  redoStack = [];
}

export function undo(): AnnotationShape | undefined {
  const shape = undoStack.pop();
  if (shape) {
    redoStack.push(shape);
  }
  return shape;
}

export function redo(): AnnotationShape | undefined {
  const shape = redoStack.pop();
  if (shape) {
    undoStack.push(shape);
  }
  return shape;
}

export function getAll(): AnnotationShape[] {
  return [...undoStack];
}

export function clear(): void {
  undoStack = [];
  redoStack = [];
}

export function hasUndo(): boolean {
  return undoStack.length > 0;
}

export function hasRedo(): boolean {
  return redoStack.length > 0;
}
