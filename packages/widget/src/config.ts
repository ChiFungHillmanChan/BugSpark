import type { BugSparkConfig } from './types';

function isValidUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}

const DEFAULT_CONFIG: Omit<BugSparkConfig, 'apiKey' | 'endpoint'> = {
  position: 'bottom-right',
  theme: 'light',
  primaryColor: '#e94560',
  enableScreenshot: true,
  enableConsoleLogs: true,
  enableNetworkLogs: true,
  enableSessionRecording: false,
};

export function mergeConfig(
  userConfig: Partial<BugSparkConfig>,
): BugSparkConfig {
  if (!userConfig.apiKey) {
    throw new Error('[BugSpark] apiKey is required in configuration');
  }

  if (!userConfig.endpoint) {
    throw new Error('[BugSpark] endpoint is required in configuration');
  }

  if (!isValidUrl(userConfig.endpoint)) {
    throw new Error('[BugSpark] endpoint must start with https:// or http://');
  }

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    apiKey: userConfig.apiKey,
    endpoint: userConfig.endpoint,
  } as BugSparkConfig;
}
