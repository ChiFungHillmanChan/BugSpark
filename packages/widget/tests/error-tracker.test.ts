import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as errorTracker from '../src/core/error-tracker';
import * as consoleInterceptor from '../src/core/console-interceptor';

describe('ErrorTracker', () => {
  beforeEach(() => {
    consoleInterceptor.clear();
  });

  afterEach(() => {
    errorTracker.stop();
    consoleInterceptor.clear();
  });

  it('start() registers window.onerror handler', () => {
    const previousOnError = window.onerror;
    errorTracker.start();
    expect(window.onerror).not.toBe(previousOnError);
  });

  it('stop() restores previous handler', () => {
    const previousOnError = window.onerror;
    errorTracker.start();
    errorTracker.stop();
    expect(window.onerror).toBe(previousOnError);
  });

  it('captures error events via window.onerror', () => {
    consoleInterceptor.start();
    errorTracker.start();

    if (window.onerror) {
      (window.onerror as Function)(
        'Test error',
        'test.js',
        10,
        5,
        new Error('Test error'),
      );
    }

    const entries = consoleInterceptor.getEntries();
    const errorEntry = entries.find(
      (entry) => entry.message.includes('[Uncaught]'),
    );
    expect(errorEntry).toBeDefined();
    expect(errorEntry!.message).toContain('Test error');
    expect(errorEntry!.level).toBe('error');
    consoleInterceptor.stop();
  });

  it('captures unhandled rejection events', () => {
    consoleInterceptor.start();
    errorTracker.start();

    const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejectionEvent, 'reason', {
      value: new Error('Promise failed'),
    });
    window.dispatchEvent(rejectionEvent);

    const entries = consoleInterceptor.getEntries();
    const rejectionEntry = entries.find(
      (entry) => entry.message.includes('[UnhandledRejection]'),
    );
    expect(rejectionEntry).toBeDefined();
    expect(rejectionEntry!.message).toContain('Promise failed');
    consoleInterceptor.stop();
  });
});
