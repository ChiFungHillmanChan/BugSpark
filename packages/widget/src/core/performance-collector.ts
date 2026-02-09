import type { PerformanceMetrics } from '../types';

let metrics: PerformanceMetrics = {};
let observers: PerformanceObserver[] = [];
let isInitialized = false;

function isPerformanceObserverSupported(entryType: string): boolean {
  try {
    return PerformanceObserver.supportedEntryTypes?.includes(entryType) ?? false;
  } catch {
    return false;
  }
}

function observeLCP(): void {
  if (!isPerformanceObserverSupported('largest-contentful-paint')) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      metrics.lcp = lastEntry.startTime;
    }
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  observers.push(observer);
}

function observeCLS(): void {
  if (!isPerformanceObserverSupported('layout-shift')) return;

  let clsValue = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      };
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
      }
    }
    metrics.cls = clsValue;
  });

  observer.observe({ type: 'layout-shift', buffered: true });
  observers.push(observer);
}

function observeFID(): void {
  if (!isPerformanceObserverSupported('first-input')) return;

  const observer = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0] as PerformanceEntry & {
      processingStart: number;
    };
    if (entry) {
      metrics.fid = entry.processingStart - entry.startTime;
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
  observers.push(observer);
}

function observeINP(): void {
  if (!isPerformanceObserverSupported('event')) return;

  let worstDuration = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const eventEntry = entry as PerformanceEntry & {
        processingStart: number;
        processingEnd: number;
      };
      const duration = eventEntry.processingEnd - eventEntry.processingStart;
      if (duration > worstDuration) {
        worstDuration = duration;
        metrics.inp = duration;
      }
    }
  });

  observer.observe({ type: 'event', buffered: true });
  observers.push(observer);
}

function collectTTFB(): void {
  try {
    const navEntries = performance.getEntriesByType('navigation');
    const navEntry = navEntries[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      metrics.ttfb = navEntry.responseStart;
    }
  } catch {
    // Navigation timing not available
  }
}

export function initPerformanceObservers(): void {
  if (isInitialized) return;
  if (typeof PerformanceObserver === 'undefined') return;

  isInitialized = true;
  metrics = {};

  collectTTFB();
  observeLCP();
  observeCLS();
  observeFID();
  observeINP();
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

export function stop(): void {
  for (const observer of observers) {
    observer.disconnect();
  }
  observers = [];
  metrics = {};
  isInitialized = false;
}
