import type { ConsoleLogEntry } from '../types';

const DEFAULT_MAX_ENTRIES = 50;
const INTERCEPTED_LEVELS = ['log', 'warn', 'error', 'info', 'debug'] as const;

type ConsoleLevel = (typeof INTERCEPTED_LEVELS)[number];

const originalMethods: Partial<Record<ConsoleLevel, (...args: unknown[]) => void>> = {};
let entries: ConsoleLogEntry[] = [];
let isRunning = false;
let maxEntries = DEFAULT_MAX_ENTRIES;

function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(value, (_key, val: unknown) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    if (val instanceof Error) {
      return { message: val.message, stack: val.stack };
    }
    if (typeof val === 'undefined') return 'undefined';
    if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
    return val;
  });
}

function formatArgs(args: unknown[]): string {
  return args.map((arg) => {
    if (typeof arg === 'string') return arg;
    try {
      return safeStringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');
}

function pushEntry(entry: ConsoleLogEntry): void {
  entries.push(entry);
  if (entries.length > maxEntries) {
    entries.shift();
  }
}

export function addEntry(entry: ConsoleLogEntry): void {
  pushEntry(entry);
}

export function start(limit: number = DEFAULT_MAX_ENTRIES): void {
  if (isRunning) return;
  isRunning = true;
  maxEntries = limit;

  for (const level of INTERCEPTED_LEVELS) {
    originalMethods[level] = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      pushEntry({
        level,
        message: formatArgs(args),
        timestamp: Date.now(),
        stack: level === 'error' && args[0] instanceof Error
          ? args[0].stack
          : undefined,
      });
      originalMethods[level]!(...args);
    };
  }
}

export function stop(): void {
  if (!isRunning) return;
  isRunning = false;

  for (const level of INTERCEPTED_LEVELS) {
    if (originalMethods[level]) {
      console[level] = originalMethods[level] as typeof console[typeof level];
      delete originalMethods[level];
    }
  }
}

export function getEntries(): ConsoleLogEntry[] {
  return [...entries];
}

export function clear(): void {
  entries = [];
}
