import type { DeviceMetadata } from '../types';
import { getPerformanceMetrics } from './performance-collector';

interface NavigatorWithExtras extends Navigator {
  connection?: { effectiveType?: string };
  deviceMemory?: number;
}

export function collectMetadata(): DeviceMetadata {
  const nav = navigator as NavigatorWithExtras;
  const perfMetrics = getPerformanceMetrics();
  const hasPerformanceData = Object.keys(perfMetrics).length > 0;

  return {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screenResolution: {
      width: screen.width,
      height: screen.height,
    },
    url: location.href,
    referrer: document.referrer,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection: nav.connection?.effectiveType,
    memory: nav.deviceMemory,
    platform: navigator.platform,
    performance: hasPerformanceData ? perfMetrics : undefined,
  };
}
