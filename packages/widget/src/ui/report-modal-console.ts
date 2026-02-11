import type { ConsoleLogEntry } from '../types';
import type { ReportModalOptions } from './report-modal';

function formatConsoleEntries(entries: ConsoleLogEntry[]): string {
  if (entries.length === 0) return 'No console errors captured.';
  return entries
    .filter((e) => e.level === 'error' || e.level === 'warn')
    .map((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      const tag = e.level.toUpperCase();
      return `[${tag}] ${time} — ${e.message}`;
    })
    .join('\n') || 'No console errors captured.';
}

export function createConsoleLogSection(currentOptions: ReportModalOptions): HTMLDivElement {
  const section = document.createElement('div');
  section.className = 'bugspark-field';

  const consoleLogs = currentOptions.consoleLogs ?? [];
  const allowed = currentOptions.consoleLogAllowed !== false;
  const errorWarnEntries = consoleLogs.filter((e) => e.level === 'error' || e.level === 'warn');
  const hasEntries = errorWarnEntries.length > 0;

  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';

  const label = document.createElement('label');
  label.textContent = 'Console Log Check';
  label.style.cssText = 'margin-bottom:0;';
  headerRow.appendChild(label);

  if (hasEntries && allowed) {
    const toggleLabel = document.createElement('label');
    toggleLabel.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;margin-bottom:0;';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.setAttribute('data-name', 'include-console-logs');
    checkbox.style.cssText = 'margin:0;';
    toggleLabel.appendChild(checkbox);
    toggleLabel.appendChild(document.createTextNode('Include in report'));
    headerRow.appendChild(toggleLabel);
  }

  section.appendChild(headerRow);

  const textarea = document.createElement('textarea');
  textarea.readOnly = true;
  textarea.rows = 4;
  textarea.style.cssText = 'font-family:monospace;font-size:11px;background:#f5f5f5;color:#333;resize:vertical;cursor:default;opacity:' + (allowed ? '1' : '0.5') + ';';
  textarea.value = formatConsoleEntries(consoleLogs);
  section.appendChild(textarea);

  if (!allowed) {
    const notice = document.createElement('div');
    notice.style.cssText = 'font-size:11px;color:#e94560;margin-top:4px;';
    notice.textContent = 'Daily limit reached (5/day). Console logs will not be included.';
    section.appendChild(notice);
  } else if (!hasEntries) {
    const notice = document.createElement('div');
    notice.style.cssText = 'font-size:11px;color:#888;margin-top:4px;';
    notice.textContent = 'No console errors or warnings detected.';
    section.appendChild(notice);
  }

  return section;
}
