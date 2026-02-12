import type { SessionEvent } from '../types';
import { getCssSelector } from '../utils/dom-helpers';

const BUFFER_DURATION_MS = 60_000;
const SCROLL_DEBOUNCE_MS = 250;
const RESIZE_DEBOUNCE_MS = 500;

let events: SessionEvent[] = [];
let snapshotEvents: SessionEvent[] | null = null;
let isRunning = false;

let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

// Captured lazily in start() to avoid breaking SPA routers that patch
// history methods after the widget script loads.
let originalPushState: typeof history.pushState | null = null;
let originalReplaceState: typeof history.replaceState | null = null;

function pushEvent(event: SessionEvent): void {
  const cutoff = Date.now() - BUFFER_DURATION_MS;
  events = events.filter((e) => e.timestamp >= cutoff);
  events.push(event);
}

function handleClick(event: MouseEvent): void {
  const target = event.target as Element | null;
  pushEvent({
    type: 'click',
    target: target ? getCssSelector(target) : undefined,
    timestamp: Date.now(),
    data: { x: event.clientX, y: event.clientY },
  });
}

function handleScroll(): void {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    pushEvent({
      type: 'scroll',
      timestamp: Date.now(),
      data: { x: window.scrollX, y: window.scrollY },
    });
  }, SCROLL_DEBOUNCE_MS);
}

function handleResize(): void {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    pushEvent({
      type: 'resize',
      timestamp: Date.now(),
      data: { width: window.innerWidth, height: window.innerHeight },
    });
  }, RESIZE_DEBOUNCE_MS);
}

function handlePopState(): void {
  pushEvent({
    type: 'navigation',
    timestamp: Date.now(),
    data: { url: location.href },
  });
}

export function start(): void {
  if (isRunning) return;
  isRunning = true;

  // Capture current methods at start time (lazy initialization),
  // matching the pattern in network-interceptor.ts.
  originalPushState = history.pushState.bind(history);
  originalReplaceState = history.replaceState.bind(history);

  document.addEventListener('click', handleClick, true);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleResize);
  window.addEventListener('popstate', handlePopState);

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState!(...args);
    pushEvent({
      type: 'navigation',
      timestamp: Date.now(),
      data: { url: location.href },
    });
  };

  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    originalReplaceState!(...args);
    pushEvent({
      type: 'navigation',
      timestamp: Date.now(),
      data: { url: location.href },
    });
  };
}

export function stop(): void {
  if (!isRunning) return;
  isRunning = false;

  document.removeEventListener('click', handleClick, true);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('popstate', handlePopState);

  if (originalPushState) history.pushState = originalPushState;
  if (originalReplaceState) history.replaceState = originalReplaceState;
  originalPushState = null;
  originalReplaceState = null;

  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (resizeTimeout) clearTimeout(resizeTimeout);

  snapshotEvents = null;
}

export function snapshot(): void {
  const cutoff = Date.now() - BUFFER_DURATION_MS;
  snapshotEvents = events.filter((e) => e.timestamp >= cutoff);
}

export function clearSnapshot(): void {
  snapshotEvents = null;
}

export function getEvents(): SessionEvent[] {
  if (snapshotEvents !== null) {
    return [...snapshotEvents];
  }
  const cutoff = Date.now() - BUFFER_DURATION_MS;
  return events.filter((e) => e.timestamp >= cutoff);
}
