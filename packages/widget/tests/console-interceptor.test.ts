import { describe, it, expect, afterEach, vi } from 'vitest';
import * as consoleInterceptor from '../src/core/console-interceptor';

describe('ConsoleInterceptor', () => {
  afterEach(() => {
    consoleInterceptor.stop();
    consoleInterceptor.clear();
  });

  it('start() patches console methods', () => {
    const logBefore = console.log;
    consoleInterceptor.start();
    expect(console.log).not.toBe(logBefore);
  });

  it('stop() restores console methods so they are no longer patched', () => {
    consoleInterceptor.start();
    const patchedLog = console.log;
    consoleInterceptor.stop();
    // After stop, console.log should no longer be the patched version
    expect(console.log).not.toBe(patchedLog);
    // Calling console.log should not add entries
    consoleInterceptor.clear();
    console.log('should not be captured');
    expect(consoleInterceptor.getEntries()).toHaveLength(0);
  });

  it('captures log entries with correct level', () => {
    consoleInterceptor.start();
    console.log('hello');
    console.warn('warning');
    console.error('bad');

    const entries = consoleInterceptor.getEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0].level).toBe('log');
    expect(entries[0].message).toBe('hello');
    expect(entries[1].level).toBe('warn');
    expect(entries[2].level).toBe('error');
  });

  it('ring buffer limits to 100 entries', () => {
    consoleInterceptor.start();
    for (let i = 0; i < 110; i++) {
      console.log(`message-${i}`);
    }
    const entries = consoleInterceptor.getEntries();
    expect(entries).toHaveLength(100);
    expect(entries[0].message).toBe('message-10');
  });

  it('getEntries() returns a copy of captured entries', () => {
    consoleInterceptor.start();
    console.log('test');
    const entries1 = consoleInterceptor.getEntries();
    const entries2 = consoleInterceptor.getEntries();
    expect(entries1).not.toBe(entries2);
    expect(entries1).toEqual(entries2);
  });

  it('clear() empties the buffer', () => {
    consoleInterceptor.start();
    console.log('test');
    expect(consoleInterceptor.getEntries()).toHaveLength(1);
    consoleInterceptor.clear();
    expect(consoleInterceptor.getEntries()).toHaveLength(0);
  });

  it('handles circular references in arguments', () => {
    consoleInterceptor.start();
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;
    console.log(circular);

    const entries = consoleInterceptor.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toContain('[Circular]');
  });
});
