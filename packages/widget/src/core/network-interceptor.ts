import type { NetworkLogEntry } from '../types';

const DEFAULT_MAX_ENTRIES = 30;

let entries: NetworkLogEntry[] = [];
let isRunning = false;
let bugsparkEndpoint = '';
let maxEntries = DEFAULT_MAX_ENTRIES;

let originalFetch: typeof window.fetch | null = null;
let originalXhrOpen: ((method: string, url: string | URL, ...rest: unknown[]) => void) | null = null;
let originalXhrSend: ((body?: Document | XMLHttpRequestBodyInit | null) => void) | null = null;

function isBugSparkRequest(url: string): boolean {
  return bugsparkEndpoint !== '' && url.startsWith(bugsparkEndpoint);
}

function pushEntry(entry: NetworkLogEntry): void {
  entries.push(entry);
  if (entries.length > maxEntries) {
    entries.shift();
  }
}

const SENSITIVE_HEADERS = new Set([
  'set-cookie',
  'authorization',
  'cookie',
  'x-api-key',
  'proxy-authorization',
  'x-csrf-token',
  'x-xsrf-token',
  'x-auth-token',
  'www-authenticate',
]);

function parseHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (!SENSITIVE_HEADERS.has(key.toLowerCase())) {
        result[key] = value;
      }
    });
  } else {
    for (const [key, value] of Object.entries(headers)) {
      if (!SENSITIVE_HEADERS.has(key.toLowerCase())) {
        result[key] = value;
      }
    }
  }
  return result;
}

function patchFetch(): void {
  const capturedFetch = originalFetch;
  if (!capturedFetch) return;

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

    if (isBugSparkRequest(url)) {
      return capturedFetch(input, init);
    }

    const method = init?.method?.toUpperCase() ?? 'GET';
    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const response = await capturedFetch(input, init);
      pushEntry({
        method,
        url,
        status: response.status,
        duration: Math.round(performance.now() - startTime),
        responseHeaders: parseHeaders(response.headers),
        timestamp,
      });
      return response;
    } catch (error) {
      pushEntry({
        method,
        url,
        status: 0,
        duration: Math.round(performance.now() - startTime),
        timestamp,
      });
      throw error;
    }
  };
}

function patchXhr(): void {
  interface XhrMetadata {
    method: string;
    url: string;
    startTime: number;
    timestamp: number;
  }

  const xhrDataMap = new WeakMap<XMLHttpRequest, XhrMetadata>();

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ): void {
    const resolvedUrl = typeof url === 'string' ? url : url.href;
    xhrDataMap.set(this, {
      method: method.toUpperCase(),
      url: resolvedUrl,
      startTime: 0,
      timestamp: 0,
    });
    return originalXhrOpen?.call(
      this,
      method,
      url,
      ...(rest as [boolean, string?, string?]),
    );
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const metadata = xhrDataMap.get(this);
    if (metadata && !isBugSparkRequest(metadata.url)) {
      metadata.startTime = performance.now();
      metadata.timestamp = Date.now();

      this.addEventListener('loadend', () => {
        pushEntry({
          method: metadata.method,
          url: metadata.url,
          status: this.status,
          duration: Math.round(performance.now() - metadata.startTime),
          timestamp: metadata.timestamp,
        });
      }, { once: true });
    }
    return originalXhrSend?.call(this, body);
  };
}

export function start(endpoint: string, limit: number = DEFAULT_MAX_ENTRIES): void {
  if (isRunning) return;
  isRunning = true;
  bugsparkEndpoint = endpoint;
  maxEntries = limit;

  // Capture originals at start time, not at module load
  originalFetch = window.fetch.bind(window);
  originalXhrOpen = XMLHttpRequest.prototype.open;
  originalXhrSend = XMLHttpRequest.prototype.send;

  patchFetch();
  patchXhr();
}

export function stop(): void {
  if (!isRunning) return;
  isRunning = false;
  if (originalFetch) window.fetch = originalFetch;
  if (originalXhrOpen) XMLHttpRequest.prototype.open = originalXhrOpen;
  if (originalXhrSend) XMLHttpRequest.prototype.send = originalXhrSend;
  originalFetch = null;
  originalXhrOpen = null;
  originalXhrSend = null;
}

export function getEntries(): NetworkLogEntry[] {
  return [...entries];
}

export function clear(): void {
  entries = [];
}
