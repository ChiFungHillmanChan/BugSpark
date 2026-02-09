import type { DeviceMetadata } from '../types';

interface NavigatorWithExtras extends Navigator {
  connection?: { effectiveType?: string };
  deviceMemory?: number;
}

export function collectMetadata(): DeviceMetadata {
  const nav = navigator as NavigatorWithExtras;

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
  };
}
