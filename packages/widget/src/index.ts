import type { BugSparkConfig, BugReport, BugSparkUser } from './types';
import { mergeConfig } from './config';
import * as consoleInterceptor from './core/console-interceptor';
import * as networkInterceptor from './core/network-interceptor';
import * as errorTracker from './core/error-tracker';
import * as sessionRecorder from './core/session-recorder';
import { collectMetadata } from './core/metadata-collector';
import { captureScreenshot } from './core/screenshot-engine';
import * as widgetContainer from './ui/widget-container';
import * as floatingButton from './ui/floating-button';
import * as reportModal from './ui/report-modal';
import * as annotationOverlay from './ui/annotation-overlay';
import { showToast } from './ui/toast';
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

  if (config.enableConsoleLogs) consoleInterceptor.start();
  if (config.enableNetworkLogs) networkInterceptor.start(config.endpoint);
  errorTracker.start();
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

  let screenshotDataUrl: string | undefined;
  if (config.enableScreenshot) {
    screenshotCanvas = await captureScreenshot();
    screenshotBlob = await canvasToBlob(screenshotCanvas);
    screenshotDataUrl = screenshotCanvas.toDataURL();
  }

  reportModal.mount(root, {
    onSubmit: handleSubmit,
    onAnnotate: handleAnnotate,
    onClose: close,
  }, screenshotDataUrl);
}

function close(): void {
  reportModal.unmount();
  annotationOverlay.unmount();
  floatingButton.show();
  screenshotCanvas = null;
  screenshotBlob = null;
  annotatedBlob = null;
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
      }, annotatedDataUrl);
    },
    onCancel: () => {
      annotationOverlay.unmount();
      const dataUrl = screenshotCanvas?.toDataURL();
      reportModal.mount(widgetContainer.getRoot(), {
        onSubmit: handleSubmit,
        onAnnotate: handleAnnotate,
        onClose: close,
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
    reporterIdentifier: formData.email || config.user?.email || config.user?.id,
  };

  try {
    await submitReport(config, report);
    close();
    showToast(root, 'Bug report submitted successfully!', 'success');
  } catch (error) {
    reportModal.setSubmitting(false);
    const message = error instanceof Error ? error.message : 'Submission failed';
    showToast(root, message, 'error');
  }
}

function destroy(): void {
  if (!isInitialized) return;

  consoleInterceptor.stop();
  networkInterceptor.stop();
  errorTracker.stop();
  sessionRecorder.stop();
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

function identify(user: BugSparkUser): void {
  if (config) {
    config.user = user;
  }
}

const BugSpark = { init, open, close, destroy, identify };

function autoInit(): void {
  const scripts = document.querySelectorAll('script[data-api-key]');
  const currentScript = scripts[scripts.length - 1];
  if (!currentScript) return;

  const apiKey = currentScript.getAttribute('data-api-key');
  if (!apiKey) return;

  const autoConfig: Partial<BugSparkConfig> = { apiKey };

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
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export default BugSpark;
export { init, open, close, destroy, identify };
export type { BugSparkConfig, BugReport, BugSparkUser };
