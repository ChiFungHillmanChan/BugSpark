import type { BugSparkConfig, BugReport } from '../types';

async function uploadScreenshot(
  endpoint: string,
  apiKey: string,
  blob: Blob,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'screenshot.png');

  const response = await fetchWithRetry(`${endpoint}/upload/screenshot`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: formData,
  });

  const data = await response.json() as { key: string };
  return data.key;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 1,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Only retry on 5xx server errors; return 4xx immediately
      if (!response.ok && response.status >= 500 && attempt < retries) continue;
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
  throw new Error('[BugSpark] Request failed after retries');
}

export async function submitReport(
  config: BugSparkConfig,
  report: BugReport,
): Promise<void> {
  let processedReport = { ...report };

  if (config.beforeSend) {
    const result = config.beforeSend(processedReport);
    if (result === null) return;
    processedReport = result;
  }

  let screenshotUrl: string | undefined;
  let annotatedScreenshotUrl: string | undefined;

  if (processedReport.screenshot) {
    screenshotUrl = await uploadScreenshot(
      config.endpoint,
      config.apiKey,
      processedReport.screenshot,
    );
  }

  if (processedReport.annotatedScreenshot) {
    annotatedScreenshotUrl = await uploadScreenshot(
      config.endpoint,
      config.apiKey,
      processedReport.annotatedScreenshot,
    );
  }

  const payload = {
    title: processedReport.title,
    description: processedReport.description,
    severity: processedReport.severity,
    category: processedReport.category,
    screenshot_url: screenshotUrl,
    annotated_screenshot_url: annotatedScreenshotUrl,
    console_logs: processedReport.consoleLogs,
    network_logs: processedReport.networkLogs,
    user_actions: processedReport.userActions,
    metadata: processedReport.metadata,
    reporter_identifier: processedReport.reporterIdentifier,
  };

  const response = await fetchWithRetry(`${config.endpoint}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[BugSpark] Report submission failed: ${response.status} ${errorBody}`);
  }

  config.onSubmit?.(processedReport);
}
