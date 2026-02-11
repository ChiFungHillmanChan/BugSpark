import type { BugSparkConfig, BugSparkUser, BugSparkBranding, BugReport } from './types';
import { init, open, close, destroy, identify, setReporter } from './widget-lifecycle';

const BugSpark = { init, open, close, destroy, identify, setReporter };

function autoInit(): void {
  const scripts = document.querySelectorAll('script[data-project-key], script[data-api-key]');
  const currentScript = scripts[scripts.length - 1];
  if (!currentScript) return;

  const projectKey = currentScript.getAttribute('data-project-key')
    || currentScript.getAttribute('data-api-key');
  if (!projectKey) return;

  const autoConfig: Partial<BugSparkConfig> = { projectKey };

  const endpoint = currentScript.getAttribute('data-endpoint');
  if (endpoint) autoConfig.endpoint = endpoint;

  const position = currentScript.getAttribute('data-position');
  if (position) autoConfig.position = position as BugSparkConfig['position'];

  const theme = currentScript.getAttribute('data-theme');
  if (theme) autoConfig.theme = theme as BugSparkConfig['theme'];

  const watermarkAttr = currentScript.getAttribute('data-watermark');
  if (watermarkAttr === 'false') {
    autoConfig.branding = { ...autoConfig.branding, showWatermark: false };
  }

  const enableScreenshotAttr = currentScript.getAttribute('data-enable-screenshot');
  if (enableScreenshotAttr === 'false') {
    autoConfig.enableScreenshot = false;
  }

  BugSpark.init(autoConfig);
}

declare global {
  interface Window {
    BugSpark?: typeof BugSpark;
  }
}

if (typeof window !== 'undefined') {
  window.BugSpark = BugSpark;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
}

export default BugSpark;
export { init, open, close, destroy, identify, setReporter };
export type { BugSparkConfig, BugReport, BugSparkUser, BugSparkBranding };
