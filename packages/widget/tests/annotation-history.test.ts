import { describe, it, expect, beforeEach } from 'vitest';
import * as annotationHistory from '../src/core/annotation-history';
import type { AnnotationShape } from '../src/types';

function createShape(overrides: Partial<AnnotationShape> = {}): AnnotationShape {
  return {
    type: 'rectangle',
    color: '#ff0000',
    lineWidth: 2,
    startX: 0,
    startY: 0,
    endX: 100,
    endY: 100,
    ...overrides,
  };
}

describe('AnnotationHistory', () => {
  beforeEach(() => {
    annotationHistory.clear();
  });

  it('push() adds shapes', () => {
    annotationHistory.push(createShape());
    annotationHistory.push(createShape({ type: 'circle' }));
    expect(annotationHistory.getAll()).toHaveLength(2);
  });

  it('undo() removes last shape and returns it', () => {
    const shape1 = createShape({ type: 'pen' });
    const shape2 = createShape({ type: 'arrow' });
    annotationHistory.push(shape1);
    annotationHistory.push(shape2);

    const undone = annotationHistory.undo();
    expect(undone).toEqual(shape2);
    expect(annotationHistory.getAll()).toHaveLength(1);
  });

  it('redo() restores undone shape', () => {
    const shape = createShape();
    annotationHistory.push(shape);
    annotationHistory.undo();

    const redone = annotationHistory.redo();
    expect(redone).toEqual(shape);
    expect(annotationHistory.getAll()).toHaveLength(1);
  });

  it('undo() returns undefined on empty stack', () => {
    expect(annotationHistory.undo()).toBeUndefined();
  });

  it('redo() returns undefined when nothing to redo', () => {
    expect(annotationHistory.redo()).toBeUndefined();
  });

  it('push() clears redo stack', () => {
    annotationHistory.push(createShape());
    annotationHistory.undo();
    expect(annotationHistory.hasRedo()).toBe(true);

    annotationHistory.push(createShape({ type: 'text' }));
    expect(annotationHistory.hasRedo()).toBe(false);
  });

  it('getAll() returns a copy of the undo stack', () => {
    annotationHistory.push(createShape());
    const all1 = annotationHistory.getAll();
    const all2 = annotationHistory.getAll();
    expect(all1).not.toBe(all2);
    expect(all1).toEqual(all2);
  });

  it('clear() resets both stacks', () => {
    annotationHistory.push(createShape());
    annotationHistory.push(createShape());
    annotationHistory.undo();

    annotationHistory.clear();
    expect(annotationHistory.getAll()).toHaveLength(0);
    expect(annotationHistory.hasUndo()).toBe(false);
    expect(annotationHistory.hasRedo()).toBe(false);
  });
});
