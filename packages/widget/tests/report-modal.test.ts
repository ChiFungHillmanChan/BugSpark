import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as reportModal from '../src/ui/report-modal';
import type { ReportModalCallbacks, ReportFormData } from '../src/ui/report-modal';

function createShadowRoot(): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host.attachShadow({ mode: 'open' });
}

function createCallbacks(overrides?: Partial<ReportModalCallbacks>): ReportModalCallbacks {
  return {
    onSubmit: vi.fn(),
    onAnnotate: vi.fn(),
    onClose: vi.fn(),
    onCapture: vi.fn(),
    ...overrides,
  };
}

describe('ReportModal', () => {
  let root: ShadowRoot;
  let callbacks: ReportModalCallbacks;

  beforeEach(() => {
    root = createShadowRoot();
    callbacks = createCallbacks();
  });

  afterEach(() => {
    reportModal.unmount();
    root.host.remove();
  });

  describe('mount()', () => {
    it('creates modal overlay in shadow root', () => {
      reportModal.mount(root, callbacks);
      expect(root.querySelector('.bugspark-overlay')).not.toBeNull();
    });

    it('renders modal with header, body, and footer', () => {
      reportModal.mount(root, callbacks);
      expect(root.querySelector('.bugspark-modal__header')).not.toBeNull();
      expect(root.querySelector('.bugspark-modal__body')).not.toBeNull();
      expect(root.querySelector('.bugspark-modal__footer')).not.toBeNull();
    });

    it('uses default title when no branding provided', () => {
      reportModal.mount(root, callbacks);
      const title = root.querySelector('.bugspark-modal__title');
      expect(title?.textContent).toBe('Report a Bug');
    });

    it('uses custom title from branding', () => {
      reportModal.mount(root, callbacks, undefined, { modalTitle: 'Custom Title' });
      const title = root.querySelector('.bugspark-modal__title');
      expect(title?.textContent).toBe('Custom Title');
    });

    it('does not double-mount if already mounted', () => {
      reportModal.mount(root, callbacks);
      reportModal.mount(root, callbacks);
      const overlays = root.querySelectorAll('.bugspark-overlay');
      expect(overlays).toHaveLength(1);
    });

    it('renders screenshot capture button when onCapture provided', () => {
      reportModal.mount(root, callbacks);
      expect(root.querySelector('.bugspark-screenshot-capture')).not.toBeNull();
    });

    it('does not render capture button when onCapture is undefined', () => {
      reportModal.mount(root, createCallbacks({ onCapture: undefined }));
      expect(root.querySelector('.bugspark-screenshot-capture')).toBeNull();
    });
  });

  describe('form fields', () => {
    it('renders title, description, severity, category, and email fields', () => {
      reportModal.mount(root, callbacks);
      expect(root.querySelector('[data-name="title"]')).not.toBeNull();
      expect(root.querySelector('[data-name="description"]')).not.toBeNull();
      expect(root.querySelector('[data-name="severity"]')).not.toBeNull();
      expect(root.querySelector('[data-name="category"]')).not.toBeNull();
      expect(root.querySelector('[data-name="email"]')).not.toBeNull();
    });

    it('severity select has correct options', () => {
      reportModal.mount(root, callbacks);
      const select = root.querySelector<HTMLSelectElement>('[data-name="severity"]');
      const options = select?.querySelectorAll('option');
      expect(options).toHaveLength(4);
      const values = Array.from(options ?? []).map((o) => o.value);
      expect(values).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('category select has correct options', () => {
      reportModal.mount(root, callbacks);
      const select = root.querySelector<HTMLSelectElement>('[data-name="category"]');
      const options = select?.querySelectorAll('option');
      expect(options).toHaveLength(5);
      const values = Array.from(options ?? []).map((o) => o.value);
      expect(values).toEqual(['bug', 'ui', 'performance', 'crash', 'other']);
    });
  });

  describe('honeypot field', () => {
    it('renders hidden honeypot input', () => {
      reportModal.mount(root, callbacks);
      const hpField = root.querySelector<HTMLInputElement>('[data-name="hp-field"]');
      expect(hpField).not.toBeNull();
      expect(hpField?.tabIndex).toBe(-1);
    });

    it('honeypot is visually hidden via aria-hidden container', () => {
      reportModal.mount(root, callbacks);
      const hpField = root.querySelector<HTMLInputElement>('[data-name="hp-field"]');
      const container = hpField?.parentElement;
      expect(container?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('validation', () => {
    it('shows error when title is too short', () => {
      reportModal.mount(root, callbacks);
      const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
      if (titleInput) titleInput.value = 'ab';

      const submitBtn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      submitBtn.click();

      expect(root.querySelector('.bugspark-field__error')).not.toBeNull();
      expect(callbacks.onSubmit).not.toHaveBeenCalled();
    });

    it('submits when title is valid', () => {
      reportModal.mount(root, callbacks);
      const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
      if (titleInput) titleInput.value = 'Valid title';

      const submitBtn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      submitBtn.click();

      expect(callbacks.onSubmit).toHaveBeenCalledOnce();
      const formData = (callbacks.onSubmit as ReturnType<typeof vi.fn>).mock.calls[0][0] as ReportFormData;
      expect(formData.title).toBe('Valid title');
    });

    it('clears previous error on resubmit', () => {
      reportModal.mount(root, callbacks);
      const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
      const submitBtn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;

      if (titleInput) titleInput.value = 'ab';
      submitBtn.click();
      expect(root.querySelector('.bugspark-field__error')).not.toBeNull();

      if (titleInput) titleInput.value = 'Valid title now';
      submitBtn.click();
      expect(root.querySelector('.bugspark-field__error')).toBeNull();
    });
  });

  describe('submit handling', () => {
    it('includes form data in submit callback', () => {
      reportModal.mount(root, callbacks);
      const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
      const descInput = root.querySelector<HTMLTextAreaElement>('[data-name="description"]');
      const emailInput = root.querySelector<HTMLInputElement>('[data-name="email"]');

      if (titleInput) titleInput.value = 'Bug title';
      if (descInput) descInput.value = 'Bug description';
      if (emailInput) emailInput.value = 'user@test.com';

      const submitBtn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      submitBtn.click();

      const formData = (callbacks.onSubmit as ReturnType<typeof vi.fn>).mock.calls[0][0] as ReportFormData;
      expect(formData.title).toBe('Bug title');
      expect(formData.description).toBe('Bug description');
      expect(formData.email).toBe('user@test.com');
      expect(formData.severity).toBe('low');
      expect(formData.category).toBe('bug');
    });

    it('includes honeypot value in form data', () => {
      reportModal.mount(root, callbacks);
      const titleInput = root.querySelector<HTMLInputElement>('[data-name="title"]');
      const hpField = root.querySelector<HTMLInputElement>('[data-name="hp-field"]');
      if (titleInput) titleInput.value = 'Valid title';
      if (hpField) hpField.value = 'bot-value';

      const submitBtn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      submitBtn.click();

      const formData = (callbacks.onSubmit as ReturnType<typeof vi.fn>).mock.calls[0][0] as ReportFormData;
      expect(formData.hpField).toBe('bot-value');
    });
  });

  describe('setSubmitting()', () => {
    it('disables submit button when submitting', () => {
      reportModal.mount(root, callbacks);
      reportModal.setSubmitting(true);

      const btn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toContain('Submitting...');
    });

    it('restores submit button text when not submitting', () => {
      reportModal.mount(root, callbacks);
      reportModal.setSubmitting(true);
      reportModal.setSubmitting(false);

      const btn = root.getElementById('bugspark-submit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toBe('Submit Report');
    });
  });

  describe('close behavior', () => {
    it('close button triggers onClose callback', () => {
      reportModal.mount(root, callbacks);
      const closeBtn = root.querySelector<HTMLButtonElement>('.bugspark-modal__close');
      closeBtn?.click();
      expect(callbacks.onClose).toHaveBeenCalledOnce();
    });

    it('cancel button triggers onClose callback', () => {
      reportModal.mount(root, callbacks);
      const cancelBtn = root.querySelector<HTMLButtonElement>('.bugspark-btn--secondary');
      cancelBtn?.click();
      expect(callbacks.onClose).toHaveBeenCalledOnce();
    });

    it('clicking overlay backdrop triggers onClose', () => {
      reportModal.mount(root, callbacks);
      const overlay = root.querySelector<HTMLDivElement>('.bugspark-overlay');
      overlay?.click();
      expect(callbacks.onClose).toHaveBeenCalledOnce();
    });
  });

  describe('unmount()', () => {
    it('removes modal from shadow root', () => {
      reportModal.mount(root, callbacks);
      reportModal.unmount();
      expect(root.querySelector('.bugspark-overlay')).toBeNull();
    });

    it('allows remounting after unmount', () => {
      reportModal.mount(root, callbacks);
      reportModal.unmount();
      reportModal.mount(root, callbacks);
      expect(root.querySelector('.bugspark-overlay')).not.toBeNull();
    });
  });

  describe('watermark', () => {
    it('shows watermark by default', () => {
      reportModal.mount(root, callbacks);
      const watermark = root.querySelector('.bugspark-watermark');
      expect(watermark).not.toBeNull();
      expect(watermark?.textContent).toContain('BugSpark');
    });

    it('hides watermark when branding.showWatermark is false', () => {
      reportModal.mount(root, callbacks, undefined, { showWatermark: false });
      expect(root.querySelector('.bugspark-watermark')).toBeNull();
    });
  });
});
