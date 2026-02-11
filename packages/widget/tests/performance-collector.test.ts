import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as performanceCollector from '../src/core/performance-collector';

describe('PerformanceCollector', () => {
  let mockObservers: Array<{ callback: PerformanceObserverCallback; disconnect: ReturnType<typeof vi.fn> }>;

  beforeEach(() => {
    mockObservers = [];

    const MockPerformanceObserver = vi.fn((callback: PerformanceObserverCallback) => {
      const observer = {
        callback,
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => []),
      };
      mockObservers.push({ callback, disconnect: observer.disconnect });
      return observer;
    });

    Object.defineProperty(MockPerformanceObserver, 'supportedEntryTypes', {
      get: () => ['largest-contentful-paint', 'layout-shift', 'first-input', 'event', 'navigation'],
    });

    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { responseStart: 42 } as PerformanceNavigationTiming,
    ]);
  });

  afterEach(() => {
    performanceCollector.stop();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('initPerformanceObservers()', () => {
    it('creates observers for supported entry types', () => {
      performanceCollector.initPerformanceObservers();
      // LCP, CLS, FID, INP = 4 observers
      expect(mockObservers).toHaveLength(4);
    });

    it('collects TTFB from navigation timing', () => {
      performanceCollector.initPerformanceObservers();
      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.ttfb).toBe(42);
    });

    it('does not double-initialize', () => {
      performanceCollector.initPerformanceObservers();
      performanceCollector.initPerformanceObservers();
      // Should still only have 4 observers, not 8
      expect(mockObservers).toHaveLength(4);
    });

    it('handles missing PerformanceObserver gracefully', () => {
      vi.stubGlobal('PerformanceObserver', undefined);
      expect(() => performanceCollector.initPerformanceObservers()).not.toThrow();
    });
  });

  describe('getPerformanceMetrics()', () => {
    it('returns empty metrics object before init', () => {
      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics).toEqual({});
    });

    it('returns a copy of metrics (not the original)', () => {
      performanceCollector.initPerformanceObservers();
      const metrics1 = performanceCollector.getPerformanceMetrics();
      const metrics2 = performanceCollector.getPerformanceMetrics();
      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });

    it('includes TTFB after initialization', () => {
      performanceCollector.initPerformanceObservers();
      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.ttfb).toBeDefined();
    });
  });

  describe('feature detection', () => {
    it('skips LCP observer when not supported', () => {
      const LimitedObserver = vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => []),
      }));
      Object.defineProperty(LimitedObserver, 'supportedEntryTypes', {
        get: () => ['layout-shift'],
      });
      vi.stubGlobal('PerformanceObserver', LimitedObserver);

      performanceCollector.initPerformanceObservers();
      // Only CLS observer should be created
      expect(LimitedObserver).toHaveBeenCalledTimes(1);
    });

    it('handles navigation timing API absence', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      performanceCollector.initPerformanceObservers();
      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.ttfb).toBeUndefined();
    });

    it('handles getEntriesByType throwing', () => {
      vi.spyOn(performance, 'getEntriesByType').mockImplementation(() => {
        throw new Error('Not supported');
      });
      expect(() => performanceCollector.initPerformanceObservers()).not.toThrow();
    });
  });

  describe('stop()', () => {
    it('disconnects all observers', () => {
      performanceCollector.initPerformanceObservers();
      performanceCollector.stop();

      for (const obs of mockObservers) {
        expect(obs.disconnect).toHaveBeenCalledOnce();
      }
    });

    it('resets metrics to empty object', () => {
      performanceCollector.initPerformanceObservers();
      expect(performanceCollector.getPerformanceMetrics().ttfb).toBe(42);

      performanceCollector.stop();
      expect(performanceCollector.getPerformanceMetrics()).toEqual({});
    });

    it('allows re-initialization after stop', () => {
      performanceCollector.initPerformanceObservers();
      performanceCollector.stop();
      performanceCollector.initPerformanceObservers();

      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.ttfb).toBe(42);
    });
  });

  describe('observer callbacks', () => {
    it('LCP observer captures last entry startTime', () => {
      performanceCollector.initPerformanceObservers();

      // Find LCP observer (first one created)
      const lcpObserver = mockObservers[0];
      const mockEntryList = {
        getEntries: () => [
          { startTime: 1000, entryType: 'largest-contentful-paint' },
          { startTime: 2500, entryType: 'largest-contentful-paint' },
        ],
      } as unknown as PerformanceObserverEntryList;

      lcpObserver.callback(mockEntryList, {} as PerformanceObserver);

      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.lcp).toBe(2500);
    });

    it('CLS observer accumulates layout shift values', () => {
      performanceCollector.initPerformanceObservers();

      // CLS is the second observer
      const clsObserver = mockObservers[1];
      const mockEntryList = {
        getEntries: () => [
          { hadRecentInput: false, value: 0.1 },
          { hadRecentInput: false, value: 0.05 },
          { hadRecentInput: true, value: 0.5 }, // Should be ignored
        ],
      } as unknown as PerformanceObserverEntryList;

      clsObserver.callback(mockEntryList, {} as PerformanceObserver);

      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.cls).toBeCloseTo(0.15);
    });

    it('FID observer captures first input delay', () => {
      performanceCollector.initPerformanceObservers();

      // FID is the third observer
      const fidObserver = mockObservers[2];
      const mockEntryList = {
        getEntries: () => [
          { startTime: 100, processingStart: 116 },
        ],
      } as unknown as PerformanceObserverEntryList;

      fidObserver.callback(mockEntryList, {} as PerformanceObserver);

      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.fid).toBe(16);
    });

    it('INP observer tracks worst interaction duration', () => {
      performanceCollector.initPerformanceObservers();

      // INP is the fourth observer
      const inpObserver = mockObservers[3];
      const mockEntryList = {
        getEntries: () => [
          { processingStart: 100, processingEnd: 120 },
          { processingStart: 200, processingEnd: 250 },
          { processingStart: 300, processingEnd: 310 },
        ],
      } as unknown as PerformanceObserverEntryList;

      inpObserver.callback(mockEntryList, {} as PerformanceObserver);

      const metrics = performanceCollector.getPerformanceMetrics();
      expect(metrics.inp).toBe(50);
    });
  });
});
