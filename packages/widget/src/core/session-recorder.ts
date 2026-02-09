import type { SessionEvent } from '../types';
import { getCssSelector } from '../utils/dom-helpers';

const BUFFER_DURATION_MS = 30_000;
const SCROLL_DEBOUNCE_MS = 250;
const RESIZE_DEBOUNCE_MS = 500;

let events: SessionEvent[] = [];
let isRunning = false;

let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

const originalPushState = history.pushState.bind(history);

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

  document.addEventListener('click', handleClick, true);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleResize);
  window.addEventListener('popstate', handlePopState);

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState(...args);
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

  history.pushState = originalPushState;

  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (resizeTimeout) clearTimeout(resizeTimeout);
}

export function getEvents(): SessionEvent[] {
  const cutoff = Date.now() - BUFFER_DURATION_MS;
  return events.filter((e) => e.timestamp >= cutoff);
}
