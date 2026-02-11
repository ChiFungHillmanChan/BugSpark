import type { BugSparkBranding, ConsoleLogEntry } from '../types';
import { createField, createCameraButton } from './report-modal-fields';
import { createConsoleLogSection } from './report-modal-console';

export interface ReportFormData {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'ui' | 'performance' | 'crash' | 'other';
  email: string;
  hpField: string;
  includeConsoleLogs: boolean;
}

export interface ReportModalCallbacks {
  onSubmit: (formData: ReportFormData) => void;
  onAnnotate: () => void;
  onClose: () => void;
  onCapture?: () => void;
}

export interface ReportModalOptions {
  screenshotUrl?: string;
  branding?: BugSparkBranding;
  ownerPlan?: string;
  consoleLogs?: ConsoleLogEntry[];
  consoleLogAllowed?: boolean;
}

let modalOverlay: HTMLDivElement | null = null;
let isSubmitting = false;
let screenshotDataUrl: string | null = null;
let currentOptions: ReportModalOptions = {};

export function mount(
  root: ShadowRoot,
  callbacks: ReportModalCallbacks,
  screenshotUrl?: string,
  branding?: BugSparkBranding,
  options?: ReportModalOptions,
): void {
  if (modalOverlay) return;
  screenshotDataUrl = screenshotUrl ?? null;
  currentOptions = options ?? {};

  modalOverlay = document.createElement('div');
  modalOverlay.className = 'bugspark-overlay';
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) callbacks.onClose();
  });

  const modal = document.createElement('div');
  modal.className = 'bugspark-modal';
  modal.appendChild(createHeader(callbacks.onClose, branding));
  modal.appendChild(createBody(callbacks, branding));
  modal.appendChild(createFooter(callbacks, branding));

  modalOverlay.appendChild(modal);
  root.appendChild(modalOverlay);
}

function createHeader(onClose: () => void, branding?: BugSparkBranding): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'bugspark-modal__header';

  const title = document.createElement('h2');
  title.className = 'bugspark-modal__title';
  title.textContent = branding?.modalTitle ?? 'Report a Bug';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'bugspark-modal__close';
  closeBtn.textContent = '\u00D7';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);
  return header;
}

function createBody(callbacks: ReportModalCallbacks, branding?: BugSparkBranding): HTMLDivElement {
  const body = document.createElement('div');
  body.className = 'bugspark-modal__body';

  if (branding?.logo) {
    const logoUrl = branding.logo;
    if (/^https?:\/\//i.test(logoUrl)) {
      const logo = document.createElement('img');
      logo.src = logoUrl;
      logo.alt = 'Logo';
      logo.style.cssText = 'max-height: 32px; margin-bottom: 12px;';
      body.appendChild(logo);
    }
  }

  if (screenshotDataUrl) {
    const preview = document.createElement('div');
    preview.className = 'bugspark-screenshot-preview';
    const img = document.createElement('img');
    img.src = screenshotDataUrl;
    img.alt = 'Screenshot preview';
    preview.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'bugspark-screenshot-preview__actions';
    const annotateBtn = document.createElement('button');
    annotateBtn.className = 'bugspark-btn bugspark-btn--secondary bugspark-btn--small';
    annotateBtn.textContent = 'Annotate';
    annotateBtn.addEventListener('click', callbacks.onAnnotate);
    actions.appendChild(annotateBtn);

    if (callbacks.onCapture && currentOptions.ownerPlan && currentOptions.ownerPlan !== 'free') {
      const recaptureBtn = document.createElement('button');
      recaptureBtn.className = 'bugspark-btn bugspark-btn--secondary bugspark-btn--small bugspark-screenshot-recapture';
      recaptureBtn.textContent = 'Re-capture';
      recaptureBtn.addEventListener('click', callbacks.onCapture);
      actions.appendChild(recaptureBtn);
    }

    preview.appendChild(actions);
    body.appendChild(preview);
  } else if (callbacks.onCapture) {
    body.appendChild(createCameraButton(callbacks.onCapture));
  }

  body.appendChild(createField('Title *', 'input', 'title'));
  body.appendChild(createField('Description', 'textarea', 'description'));

  body.appendChild(createConsoleLogSection(currentOptions));

  const row = document.createElement('div');
  row.className = 'bugspark-field__row';
  row.appendChild(createField('Severity', 'select', 'severity', [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ]));
  row.appendChild(createField('Category', 'select', 'category', [
    { value: 'bug', label: 'Bug' },
    { value: 'ui', label: 'UI Issue' },
    { value: 'performance', label: 'Performance' },
    { value: 'crash', label: 'Crash' },
    { value: 'other', label: 'Other' },
  ]));
  body.appendChild(row);

  body.appendChild(createField('Email', 'input', 'email'));

  const hpGroup = document.createElement('div');
  hpGroup.setAttribute('aria-hidden', 'true');
  hpGroup.style.cssText = 'position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;';
  const hpInput = document.createElement('input');
  hpInput.setAttribute('data-name', 'hp-field');
  hpInput.tabIndex = -1;
  hpInput.autocomplete = 'off';
  hpGroup.appendChild(hpInput);
  body.appendChild(hpGroup);

  return body;
}

function createFooter(callbacks: ReportModalCallbacks, branding?: BugSparkBranding): HTMLDivElement {
  const footer = document.createElement('div');
  footer.className = 'bugspark-modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bugspark-btn bugspark-btn--secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', callbacks.onClose);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'bugspark-btn bugspark-btn--primary';
  submitBtn.id = 'bugspark-submit-btn';
  submitBtn.textContent = 'Submit Report';
  submitBtn.addEventListener('click', () => handleSubmit(callbacks.onSubmit));

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  if (branding?.showWatermark !== false) {
    const watermark = document.createElement('div');
    watermark.className = 'bugspark-watermark';
    const link = document.createElement('a');
    link.href = 'https://bugspark.io';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Powered by BugSpark';
    watermark.appendChild(link);
    footer.appendChild(watermark);
  }

  return footer;
}

function handleSubmit(onSubmit: (data: ReportFormData) => void): void {
  if (isSubmitting || !modalOverlay) return;

  const root = modalOverlay.getRootNode() as ShadowRoot;
  const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
  const titleValue = titleInput?.value.trim() ?? '';

  const errorEl = root.querySelector('.bugspark-field__error');
  if (errorEl) errorEl.remove();

  if (titleValue.length < 3) {
    if (titleInput) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'bugspark-field__error';
      errorDiv.textContent = 'Title must be at least 3 characters';
      titleInput.parentElement?.appendChild(errorDiv);
    }
    return;
  }

  const consoleCheckbox = root.querySelector<HTMLInputElement>('[data-name="include-console-logs"]');
  const includeConsoleLogs = consoleCheckbox ? consoleCheckbox.checked : false;

  const formData: ReportFormData = {
    title: titleValue,
    description: root.querySelector<HTMLTextAreaElement>('[data-name="description"]')?.value ?? '',
    severity: (root.querySelector<HTMLSelectElement>('[data-name="severity"]')?.value ?? 'medium') as ReportFormData['severity'],
    category: (root.querySelector<HTMLSelectElement>('[data-name="category"]')?.value ?? 'bug') as ReportFormData['category'],
    email: root.querySelector<HTMLInputElement>('[data-name="email"]')?.value ?? '',
    hpField: (root.querySelector<HTMLInputElement>('[data-name="hp-field"]'))?.value ?? '',
    includeConsoleLogs,
  };

  onSubmit(formData);
}

export function setSubmitting(submitting: boolean): void {
  isSubmitting = submitting;
  if (!modalOverlay) return;

  const root = modalOverlay.getRootNode() as ShadowRoot;
  const btn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = submitting;
    if (submitting) {
      const spinner = document.createElement('span');
      spinner.className = 'bugspark-spinner';
      btn.textContent = '';
      btn.appendChild(spinner);
      btn.appendChild(document.createTextNode('Submitting...'));
    } else {
      btn.textContent = 'Submit Report';
    }
  }
}

export function unmount(): void {
  if (modalOverlay) {
    modalOverlay.remove();
    modalOverlay = null;
    isSubmitting = false;
    screenshotDataUrl = null;
    currentOptions = {};
  }
}
