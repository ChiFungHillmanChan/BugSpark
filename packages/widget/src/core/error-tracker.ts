import { addEntry } from './console-interceptor';

let isRunning = false;
let previousOnError: OnErrorEventHandler = null;
let previousOnUnhandledRejection: ((ev: PromiseRejectionEvent) => void) | null = null;

function handleWindowError(
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): void {
  const errorMessage = typeof message === 'string' ? message : 'Unknown error';
  const stack = error?.stack
    ?? `at ${source ?? 'unknown'}:${lineno ?? 0}:${colno ?? 0}`;

  addEntry({
    level: 'error',
    message: `[Uncaught] ${errorMessage}`,
    timestamp: Date.now(),
    stack,
  });
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const message = reason instanceof Error
    ? reason.message
    : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  addEntry({
    level: 'error',
    message: `[UnhandledRejection] ${message}`,
    timestamp: Date.now(),
    stack,
  });
}

export function start(): void {
  if (isRunning) return;
  isRunning = true;

  previousOnError = window.onerror;
  previousOnUnhandledRejection = window.onunhandledrejection as
    | ((ev: PromiseRejectionEvent) => void)
    | null;

  window.onerror = (message, source, lineno, colno, error) => {
    handleWindowError(message, source, lineno, colno, error);
    if (typeof previousOnError === 'function') {
      previousOnError.call(window, message, source, lineno, colno, error);
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

export function stop(): void {
  if (!isRunning) return;
  isRunning = false;

  window.onerror = previousOnError;
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  if (previousOnUnhandledRejection) {
    window.onunhandledrejection = previousOnUnhandledRejection as
      typeof window.onunhandledrejection;
  }
}
