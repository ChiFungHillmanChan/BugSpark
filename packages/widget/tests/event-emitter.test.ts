import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/utils/event-emitter';

describe('EventEmitter', () => {
  it('on() registers handler and emit() calls it', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.emit('test', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('off() removes handler so it is no longer called', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test', null);
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple handlers for the same event', () => {
    const emitter = new EventEmitter();
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    emitter.on('click', handlerA);
    emitter.on('click', handlerB);
    emitter.emit('click', 'data');
    expect(handlerA).toHaveBeenCalledWith('data');
    expect(handlerB).toHaveBeenCalledWith('data');
  });

  it('does not error when emitting event with no handlers', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit('nonexistent', null)).not.toThrow();
  });

  it('removeAll() clears all handlers', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('event1', handler);
    emitter.on('event2', handler);
    emitter.removeAll();
    emitter.emit('event1', null);
    emitter.emit('event2', null);
    expect(handler).not.toHaveBeenCalled();
  });

  it('off() on unknown event does not throw', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.off('unknown', vi.fn())).not.toThrow();
  });
});
