import type { BugSparkConfig } from './types';

const DEFAULT_CONFIG: Omit<BugSparkConfig, 'apiKey'> = {
  endpoint: 'http://localhost:8000/api/v1',
  position: 'bottom-right',
  theme: 'light',
  primaryColor: '#e94560',
  enableScreenshot: true,
  enableConsoleLogs: true,
  enableNetworkLogs: true,
  enableSessionRecording: true,
};

export function mergeConfig(
  userConfig: Partial<BugSparkConfig>,
): BugSparkConfig {
  if (!userConfig.apiKey) {
    throw new Error('[BugSpark] apiKey is required in configuration');
  }

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    apiKey: userConfig.apiKey,
  } as BugSparkConfig;
}
