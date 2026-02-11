import type { StyleVars } from './styles-base';

export function getModalStyles(vars: StyleVars): string {
  return `
    .bugspark-modal {
      background: ${vars.bgColor}; color: ${vars.textColor}; border-radius: 12px;
      width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: bugspark-slideUp 0.3s ease;
    }
    .bugspark-modal__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid ${vars.borderColor};
    }
    .bugspark-modal__title { font-size: 18px; font-weight: 600; }
    .bugspark-modal__close {
      background: none; border: none; cursor: pointer; padding: 4px;
      color: ${vars.textColor}; font-size: 20px; line-height: 1; opacity: 0.6;
    }
    .bugspark-modal__close:hover { opacity: 1; }
    .bugspark-modal__body { padding: 24px; }
    .bugspark-modal__footer {
      display: flex; gap: 12px; justify-content: flex-end;
      padding: 16px 24px; border-top: 1px solid ${vars.borderColor};
    }

    .bugspark-field { margin-bottom: 16px; }
    .bugspark-field label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: ${vars.textColor}; }
    .bugspark-field input, .bugspark-field textarea, .bugspark-field select {
      width: 100%; padding: 10px 12px; border: 1px solid ${vars.borderColor};
      border-radius: 8px; font-size: 14px; background: ${vars.inputBg};
      color: ${vars.textColor}; outline: none; transition: border-color 0.2s;
      font-family: inherit;
    }
    .bugspark-field input:focus, .bugspark-field textarea:focus, .bugspark-field select:focus {
      border-color: ${vars.primaryColor};
    }
    .bugspark-field textarea { resize: vertical; min-height: 80px; }
    .bugspark-field__row { display: flex; gap: 12px; }
    .bugspark-field__row .bugspark-field { flex: 1; }
    .bugspark-field__error { color: #e94560; font-size: 12px; margin-top: 4px; }

    .bugspark-screenshot-preview {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      background: ${vars.surfaceBg}; border-radius: 8px; margin-bottom: 16px;
    }
    .bugspark-screenshot-preview img {
      width: 120px; height: 68px; object-fit: cover; border-radius: 4px;
      border: 1px solid ${vars.borderColor};
    }
    .bugspark-screenshot-preview__actions { flex: 1; display: flex; gap: 8px; }

    .bugspark-screenshot-capture {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 24px; margin-bottom: 16px;
      border: 2px dashed ${vars.borderColor}; border-radius: 8px;
      cursor: pointer; color: ${vars.textColor}; opacity: 0.6;
      transition: opacity 0.2s, border-color 0.2s;
    }
    .bugspark-screenshot-capture:hover {
      opacity: 1; border-color: ${vars.primaryColor};
    }
    .bugspark-screenshot-capture svg { width: 32px; height: 32px; }
    .bugspark-screenshot-capture span { font-size: 13px; font-weight: 500; }

    .bugspark-screenshot-recapture { margin-left: 0; }

    .bugspark-btn {
      padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; border: none; transition: opacity 0.2s; font-family: inherit;
    }
    .bugspark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .bugspark-btn--primary { background: ${vars.primaryColor}; color: white; }
    .bugspark-btn--primary:hover:not(:disabled) { opacity: 0.9; }
    .bugspark-btn--secondary { background: ${vars.surfaceBg}; color: ${vars.textColor}; border: 1px solid ${vars.borderColor}; }
    .bugspark-btn--secondary:hover:not(:disabled) { opacity: 0.8; }
    .bugspark-btn--small { padding: 6px 12px; font-size: 12px; }

    .bugspark-spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
      border-radius: 50%; animation: bugspark-spin 0.6s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
  `;
}
