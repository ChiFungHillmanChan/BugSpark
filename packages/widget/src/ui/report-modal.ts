export interface ReportFormData {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'ui' | 'performance' | 'crash' | 'other';
  email: string;
}

export interface ReportModalCallbacks {
  onSubmit: (formData: ReportFormData) => void;
  onAnnotate: () => void;
  onClose: () => void;
}

let modalOverlay: HTMLDivElement | null = null;
let isSubmitting = false;
let screenshotDataUrl: string | null = null;

export function mount(
  root: ShadowRoot,
  callbacks: ReportModalCallbacks,
  screenshotUrl?: string,
): void {
  if (modalOverlay) return;
  screenshotDataUrl = screenshotUrl ?? null;

  modalOverlay = document.createElement('div');
  modalOverlay.className = 'bugspark-overlay';
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) callbacks.onClose();
  });

  const modal = document.createElement('div');
  modal.className = 'bugspark-modal';
  modal.appendChild(createHeader(callbacks.onClose));
  modal.appendChild(createBody(callbacks));
  modal.appendChild(createFooter(callbacks));

  modalOverlay.appendChild(modal);
  root.appendChild(modalOverlay);
}

function createHeader(onClose: () => void): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'bugspark-modal__header';

  const title = document.createElement('h2');
  title.className = 'bugspark-modal__title';
  title.textContent = 'Report a Bug';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'bugspark-modal__close';
  closeBtn.textContent = '\u00D7';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);
  return header;
}

function createField(
  labelText: string,
  inputType: 'input' | 'textarea' | 'select',
  name: string,
  options?: Array<{ value: string; label: string }>,
): HTMLDivElement {
  const field = document.createElement('div');
  field.className = 'bugspark-field';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.setAttribute('for', `bugspark-${name}`);
  field.appendChild(label);

  if (inputType === 'select' && options) {
    const select = document.createElement('select');
    select.id = `bugspark-${name}`;
    select.setAttribute('data-name', name);
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }
    field.appendChild(select);
  } else if (inputType === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.id = `bugspark-${name}`;
    textarea.setAttribute('data-name', name);
    textarea.placeholder = 'Describe the issue in detail...';
    textarea.rows = 4;
    field.appendChild(textarea);
  } else {
    const input = document.createElement('input');
    input.id = `bugspark-${name}`;
    input.type = 'text';
    input.setAttribute('data-name', name);
    if (name === 'email') {
      input.type = 'email';
      input.placeholder = 'your@email.com (optional)';
    } else {
      input.placeholder = 'Brief summary of the issue';
    }
    field.appendChild(input);
  }

  return field;
}

function createBody(callbacks: ReportModalCallbacks): HTMLDivElement {
  const body = document.createElement('div');
  body.className = 'bugspark-modal__body';

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
    preview.appendChild(actions);
    body.appendChild(preview);
  }

  body.appendChild(createField('Title *', 'input', 'title'));
  body.appendChild(createField('Description', 'textarea', 'description'));

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

  return body;
}

function createFooter(callbacks: ReportModalCallbacks): HTMLDivElement {
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

  const formData: ReportFormData = {
    title: titleValue,
    description: root.querySelector<HTMLTextAreaElement>('[data-name="description"]')?.value ?? '',
    severity: (root.querySelector<HTMLSelectElement>('[data-name="severity"]')?.value ?? 'medium') as ReportFormData['severity'],
    category: (root.querySelector<HTMLSelectElement>('[data-name="category"]')?.value ?? 'bug') as ReportFormData['category'],
    email: root.querySelector<HTMLInputElement>('[data-name="email"]')?.value ?? '',
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
  }
}
