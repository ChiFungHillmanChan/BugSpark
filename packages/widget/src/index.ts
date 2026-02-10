import type { BugSparkConfig, BugReport, BugSparkUser, BugSparkBranding } from './types';
import { mergeConfig } from './config';
import * as consoleInterceptor from './core/console-interceptor';
import * as networkInterceptor from './core/network-interceptor';
import * as errorTracker from './core/error-tracker';
import * as sessionRecorder from './core/session-recorder';
import * as performanceCollector from './core/performance-collector';
import { collectMetadata } from './core/metadata-collector';
import { captureScreenshot } from './core/screenshot-engine';
import * as widgetContainer from './ui/widget-container';
import * as floatingButton from './ui/floating-button';
import * as reportModal from './ui/report-modal';
import * as annotationOverlay from './ui/annotation-overlay';
import { showToast, dismiss as dismissToast } from './ui/toast';
import { submitReport } from './api/report-composer';

let config: BugSparkConfig | null = null;
let screenshotCanvas: HTMLCanvasElement | null = null;
let screenshotBlob: Blob | null = null;
let annotatedBlob: Blob | null = null;
let isInitialized = false;
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 30000;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('[BugSpark] Failed to convert canvas to blob'));
    }, 'image/png');
  });
}

function init(userConfig: Partial<BugSparkConfig>): void {
  if (isInitialized) {
    console.warn('[BugSpark] Already initialized');
    return;
  }

  config = mergeConfig(userConfig);
  isInitialized = true;

  if (config.collectConsole) consoleInterceptor.start(config.maxConsoleLogs);
  if (config.collectNetwork) networkInterceptor.start(config.endpoint, config.maxNetworkLogs);
  errorTracker.start();
  performanceCollector.initPerformanceObservers();
  if (config.enableSessionRecording) sessionRecorder.start();

  widgetContainer.mount(config.primaryColor, config.theme, config.branding);
  const root = widgetContainer.getRoot();
  floatingButton.mount(root, config.position, () => open(), config.branding?.buttonText);

  fetchRemoteConfig(config);
}

function fetchRemoteConfig(currentConfig: BugSparkConfig): void {
  fetch(`${currentConfig.endpoint}/projects/widget-config`, {
    headers: { 'X-API-Key': currentConfig.projectKey },
  })
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .then((data: Record<string, unknown> | undefined) => {
      if (!data || !config) return;
      let shouldUpdateTheme = false;

      if (typeof data.enableScreenshot === 'boolean') {
        config.enableScreenshot = data.enableScreenshot;
      }
      if (typeof data.showWatermark === 'boolean') {
        config.branding = { ...config.branding, showWatermark: data.showWatermark };
      }
      if (typeof data.ownerPlan === 'string') {
        config.ownerPlan = data.ownerPlan;
      }
      if (typeof data.primaryColor === 'string' && data.primaryColor.startsWith('#') && data.primaryColor !== config.primaryColor) {
        config.primaryColor = data.primaryColor;
        shouldUpdateTheme = true;
      }
      if (typeof data.buttonText === 'string') {
        config.branding = { ...config.branding, buttonText: data.buttonText };
      }
      if (typeof data.modalTitle === 'string') {
        config.branding = { ...config.branding, modalTitle: data.modalTitle };
      }
      if (typeof data.logoUrl === 'string' && /^https?:\/\//i.test(data.logoUrl)) {
        config.branding = { ...config.branding, logo: data.logoUrl };
      }

      if (shouldUpdateTheme) {
        widgetContainer.updateTheme(config.primaryColor, config.theme, config.branding);
      }
    })
    .catch(() => {
      // Silently ignore — widget continues with local config
    });
}

let consoleLogAllowed = true;

async function fetchConsoleLogQuota(): Promise<boolean> {
  if (!config) return true;
  try {
    const res = await fetch(`${config.endpoint}/projects/console-log-quota`, {
      headers: { 'X-API-Key': config.projectKey },
    });
    if (!res.ok) return true;
    const data = await res.json() as { allowed: boolean };
    return data.allowed !== false;
  } catch {
    return true;
  }
}

async function open(): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  floatingButton.hide();
  annotatedBlob = null;

  consoleLogAllowed = await fetchConsoleLogQuota();

  const modalOptions: import('./ui/report-modal').ReportModalOptions = {
    ownerPlan: config.ownerPlan,
    consoleLogs: config.collectConsole ? consoleInterceptor.getEntries() : [],
    consoleLogAllowed,
  };

  reportModal.mount(root, {
    onSubmit: handleSubmit,
    onAnnotate: handleAnnotate,
    onClose: close,
    onCapture: config.enableScreenshot ? handleCapture : undefined,
  }, undefined, config.branding, modalOptions);

  config.onOpen?.();
}

function buildModalOptions(): import('./ui/report-modal').ReportModalOptions {
  return {
    ownerPlan: config?.ownerPlan,
    consoleLogs: config?.collectConsole ? consoleInterceptor.getEntries() : [],
    consoleLogAllowed,
  };
}

async function handleCapture(): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  reportModal.unmount();
  annotatedBlob = null;
  screenshotCanvas = await captureScreenshot();
  screenshotBlob = await canvasToBlob(screenshotCanvas);
  const screenshotDataUrl = screenshotCanvas.toDataURL();

  reportModal.mount(root, {
    onSubmit: handleSubmit,
    onAnnotate: handleAnnotate,
    onClose: close,
    onCapture: config.enableScreenshot ? handleCapture : undefined,
  }, screenshotDataUrl, config.branding, buildModalOptions());
}

function close(): void {
  reportModal.unmount();
  annotationOverlay.unmount();
  floatingButton.show();
  screenshotCanvas = null;
  screenshotBlob = null;
  annotatedBlob = null;
  config?.onClose?.();
}

function handleAnnotate(): void {
  if (!config || !screenshotCanvas) return;
  const root = widgetContainer.getRoot();
  reportModal.unmount();

  const captureCallback = config.enableScreenshot ? handleCapture : undefined;

  annotationOverlay.mount(root, screenshotCanvas, {
    onDone: async (annotatedCanvas) => {
      annotatedBlob = await canvasToBlob(annotatedCanvas);
      annotationOverlay.unmount();

      const annotatedDataUrl = annotatedCanvas.toDataURL();
      reportModal.mount(root, {
        onSubmit: handleSubmit,
        onAnnotate: handleAnnotate,
        onClose: close,
        onCapture: captureCallback,
      }, annotatedDataUrl, config?.branding, buildModalOptions());
    },
    onCancel: () => {
      annotationOverlay.unmount();
      const dataUrl = screenshotCanvas?.toDataURL();
      reportModal.mount(widgetContainer.getRoot(), {
        onSubmit: handleSubmit,
        onAnnotate: handleAnnotate,
        onClose: close,
        onCapture: captureCallback,
      }, dataUrl, config?.branding, buildModalOptions());
    },
  });
}

async function handleSubmit(formData: import('./ui/report-modal').ReportFormData): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  if (Date.now() - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
    showToast(root, 'Please wait before submitting another report.', 'error');
    return;
  }

  reportModal.setSubmitting(true);

  const shouldIncludeConsole = formData.includeConsoleLogs && consoleLogAllowed;

  const report: BugReport = {
    title: formData.title,
    description: formData.description,
    severity: formData.severity,
    category: formData.category,
    screenshot: screenshotBlob ?? undefined,
    annotatedScreenshot: annotatedBlob ?? undefined,
    consoleLogs: shouldIncludeConsole ? consoleInterceptor.getEntries() : [],
    networkLogs: networkInterceptor.getEntries(),
    userActions: sessionRecorder.getEvents(),
    metadata: collectMetadata(),
    reporterIdentifier: formData.email || config.reporterIdentifier || config.user?.email || config.user?.id,
    hpField: formData.hpField,
  };

  try {
    await submitReport(config, report);
    lastSubmitTime = Date.now();
    close();
    showToast(root, 'Bug report submitted successfully!', 'success');
  } catch (error) {
    reportModal.setSubmitting(false);
    const typedError = error instanceof Error ? error : new Error('Submission failed');
    config.onError?.(typedError);
    showToast(root, typedError.message, 'error');
  }
}

function destroy(): void {
  if (!isInitialized) return;

  dismissToast();
  consoleInterceptor.stop();
  networkInterceptor.stop();
  errorTracker.stop();
  sessionRecorder.stop();
  performanceCollector.stop();
  reportModal.unmount();
  annotationOverlay.unmount();
  floatingButton.unmount();
  widgetContainer.unmount();

  config = null;
  isInitialized = false;
  screenshotCanvas = null;
  screenshotBlob = null;
  annotatedBlob = null;
}

function setReporter(identifier: string): void {
  if (config) {
    config.reporterIdentifier = identifier;
  }
}

/** @deprecated Use `setReporter` instead */
function identify(user: BugSparkUser): void {
  if (config) {
    config.user = user;
  }
}

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
