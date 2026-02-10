import type { BugSparkConfig } from './types';

function isValidUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}

const DEFAULT_CONFIG: Omit<BugSparkConfig, 'projectKey' | 'apiKey' | 'endpoint' | 'enableConsoleLogs' | 'enableNetworkLogs'> = {
  position: 'bottom-right',
  theme: 'light',
  primaryColor: '#e94560',
  enableScreenshot: true,
  collectConsole: true,
  collectNetwork: true,
  enableSessionRecording: false,
  maxConsoleLogs: 50,
  maxNetworkLogs: 30,
};

export function mergeConfig(
  userConfig: Partial<BugSparkConfig>,
): BugSparkConfig {
  const projectKey = userConfig.projectKey || userConfig.apiKey;
  if (!projectKey) {
    throw new Error('[BugSpark] projectKey is required in configuration');
  }

  if (!userConfig.endpoint) {
    throw new Error('[BugSpark] endpoint is required in configuration');
  }

  if (!isValidUrl(userConfig.endpoint)) {
    throw new Error('[BugSpark] endpoint must start with https:// or http://');
  }

  const collectConsole = userConfig.collectConsole ?? userConfig.enableConsoleLogs ?? DEFAULT_CONFIG.collectConsole;
  const collectNetwork = userConfig.collectNetwork ?? userConfig.enableNetworkLogs ?? DEFAULT_CONFIG.collectNetwork;

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    projectKey,
    endpoint: userConfig.endpoint,
    collectConsole,
    collectNetwork,
  } as BugSparkConfig;
}
