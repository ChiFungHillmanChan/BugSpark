import type { NetworkLogEntry } from '../types';

const MAX_ENTRIES = 50;

let entries: NetworkLogEntry[] = [];
let isRunning = false;
let bugsparkEndpoint = '';

const originalFetch = window.fetch.bind(window);
const originalXhrOpen = XMLHttpRequest.prototype.open;
const originalXhrSend = XMLHttpRequest.prototype.send;

function isBugSparkRequest(url: string): boolean {
  return bugsparkEndpoint !== '' && url.startsWith(bugsparkEndpoint);
}

function pushEntry(entry: NetworkLogEntry): void {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function parseHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
  } else {
    Object.assign(result, headers);
  }
  return result;
}

function patchFetch(): void {
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
      return originalFetch(input, init);
    }

    const method = init?.method?.toUpperCase() ?? 'GET';
    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const response = await originalFetch(input, init);
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
    return originalXhrOpen.call(
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
      });
    }
    return originalXhrSend.call(this, body);
  };
}

export function start(endpoint: string): void {
  if (isRunning) return;
  isRunning = true;
  bugsparkEndpoint = endpoint;
  patchFetch();
  patchXhr();
}

export function stop(): void {
  if (!isRunning) return;
  isRunning = false;
  window.fetch = originalFetch;
  XMLHttpRequest.prototype.open = originalXhrOpen;
  XMLHttpRequest.prototype.send = originalXhrSend;
}

export function getEntries(): NetworkLogEntry[] {
  return [...entries];
}

export function clear(): void {
  entries = [];
}
