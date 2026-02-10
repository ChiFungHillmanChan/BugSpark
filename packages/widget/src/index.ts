import type { BugSparkConfig, BugReport, BugSparkUser } from './types';
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

  widgetContainer.mount(config.primaryColor, config.theme);
  const root = widgetContainer.getRoot();
  floatingButton.mount(root, config.position, () => open());
}

async function open(): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  floatingButton.hide();
  annotatedBlob = null;

  reportModal.mount(root, {
    onSubmit: handleSubmit,
    onAnnotate: handleAnnotate,
    onClose: close,
    onCapture: handleCapture,
  }, undefined);

  config.onOpen?.();
}

async function handleCapture(): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  reportModal.unmount();
  screenshotCanvas = await captureScreenshot();
  screenshotBlob = await canvasToBlob(screenshotCanvas);
  const screenshotDataUrl = screenshotCanvas.toDataURL();

  reportModal.mount(root, {
    onSubmit: handleSubmit,
    onAnnotate: handleAnnotate,
    onClose: close,
    onCapture: handleCapture,
  }, screenshotDataUrl);
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

  annotationOverlay.mount(root, screenshotCanvas, {
    onDone: async (annotatedCanvas) => {
      annotatedBlob = await canvasToBlob(annotatedCanvas);
      annotationOverlay.unmount();

      const annotatedDataUrl = annotatedCanvas.toDataURL();
      reportModal.mount(root, {
        onSubmit: handleSubmit,
        onAnnotate: handleAnnotate,
        onClose: close,
        onCapture: handleCapture,
      }, annotatedDataUrl);
    },
    onCancel: () => {
      annotationOverlay.unmount();
      const dataUrl = screenshotCanvas?.toDataURL();
      reportModal.mount(widgetContainer.getRoot(), {
        onSubmit: handleSubmit,
        onAnnotate: handleAnnotate,
        onClose: close,
        onCapture: handleCapture,
      }, dataUrl);
    },
  });
}

async function handleSubmit(formData: import('./ui/report-modal').ReportFormData): Promise<void> {
  if (!config) return;
  const root = widgetContainer.getRoot();

  reportModal.setSubmitting(true);

  const report: BugReport = {
    title: formData.title,
    description: formData.description,
    severity: formData.severity,
    category: formData.category,
    screenshot: screenshotBlob ?? undefined,
    annotatedScreenshot: annotatedBlob ?? undefined,
    consoleLogs: consoleInterceptor.getEntries(),
    networkLogs: networkInterceptor.getEntries(),
    userActions: sessionRecorder.getEvents(),
    metadata: collectMetadata(),
    reporterIdentifier: formData.email || config.reporterIdentifier || config.user?.email || config.user?.id,
  };

  try {
    await submitReport(config, report);
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

  BugSpark.init(autoConfig);
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, typeof BugSpark>).BugSpark = BugSpark;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
}

export default BugSpark;
export { init, open, close, destroy, identify, setReporter };
export type { BugSparkConfig, BugReport, BugSparkUser };
