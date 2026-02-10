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
  retries = 2,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && response.status >= 500 && attempt < retries) {
        await delay(attempt);
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      await delay(attempt);
    }
  }
  throw new Error('[BugSpark] Request failed after retries');
}

function delay(attempt: number): Promise<void> {
  const ms = Math.min(1000 * Math.pow(2, attempt), 8000);
  return new Promise((resolve) => setTimeout(resolve, ms));
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
