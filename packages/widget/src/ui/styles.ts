export function getStyles(primaryColor: string, theme: 'light' | 'dark' | 'auto'): string {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1a1a2e' : '#ffffff';
  const textColor = isDark ? '#e0e0e0' : '#333333';
  const borderColor = isDark ? '#333355' : '#e0e0e0';
  const inputBg = isDark ? '#16213e' : '#f8f8f8';
  const overlayBg = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
  const surfaceBg = isDark ? '#16213e' : '#f5f5f5';

  return `
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes bugspark-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bugspark-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bugspark-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes bugspark-spin { to { transform: rotate(360deg); } }

    .bugspark-fab {
      position: fixed; width: 56px; height: 56px; border-radius: 50%;
      background: ${primaryColor}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 999998;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .bugspark-fab:hover { animation: bugspark-pulse 1s ease-in-out infinite; box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
    .bugspark-fab svg { width: 28px; height: 28px; fill: white; }
    .bugspark-fab--bottom-right { bottom: 24px; right: 24px; }
    .bugspark-fab--bottom-left { bottom: 24px; left: 24px; }
    .bugspark-fab--top-right { top: 24px; right: 24px; }
    .bugspark-fab--top-left { top: 24px; left: 24px; }

    .bugspark-overlay {
      position: fixed; inset: 0; background: ${overlayBg};
      display: flex; align-items: center; justify-content: center;
      z-index: 999999; animation: bugspark-fadeIn 0.2s ease;
    }

    .bugspark-modal {
      background: ${bgColor}; color: ${textColor}; border-radius: 12px;
      width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: bugspark-slideUp 0.3s ease;
    }
    .bugspark-modal__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid ${borderColor};
    }
    .bugspark-modal__title { font-size: 18px; font-weight: 600; }
    .bugspark-modal__close {
      background: none; border: none; cursor: pointer; padding: 4px;
      color: ${textColor}; font-size: 20px; line-height: 1; opacity: 0.6;
    }
    .bugspark-modal__close:hover { opacity: 1; }
    .bugspark-modal__body { padding: 24px; }
    .bugspark-modal__footer {
      display: flex; gap: 12px; justify-content: flex-end;
      padding: 16px 24px; border-top: 1px solid ${borderColor};
    }

    .bugspark-field { margin-bottom: 16px; }
    .bugspark-field label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: ${textColor}; }
    .bugspark-field input, .bugspark-field textarea, .bugspark-field select {
      width: 100%; padding: 10px 12px; border: 1px solid ${borderColor};
      border-radius: 8px; font-size: 14px; background: ${inputBg};
      color: ${textColor}; outline: none; transition: border-color 0.2s;
      font-family: inherit;
    }
    .bugspark-field input:focus, .bugspark-field textarea:focus, .bugspark-field select:focus {
      border-color: ${primaryColor};
    }
    .bugspark-field textarea { resize: vertical; min-height: 80px; }
    .bugspark-field__row { display: flex; gap: 12px; }
    .bugspark-field__row .bugspark-field { flex: 1; }
    .bugspark-field__error { color: #e94560; font-size: 12px; margin-top: 4px; }

    .bugspark-screenshot-preview {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      background: ${surfaceBg}; border-radius: 8px; margin-bottom: 16px;
    }
    .bugspark-screenshot-preview img {
      width: 120px; height: 68px; object-fit: cover; border-radius: 4px;
      border: 1px solid ${borderColor};
    }
    .bugspark-screenshot-preview__actions { flex: 1; }

    .bugspark-btn {
      padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; border: none; transition: opacity 0.2s; font-family: inherit;
    }
    .bugspark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .bugspark-btn--primary { background: ${primaryColor}; color: white; }
    .bugspark-btn--primary:hover:not(:disabled) { opacity: 0.9; }
    .bugspark-btn--secondary { background: ${surfaceBg}; color: ${textColor}; border: 1px solid ${borderColor}; }
    .bugspark-btn--secondary:hover:not(:disabled) { opacity: 0.8; }
    .bugspark-btn--small { padding: 6px 12px; font-size: 12px; }

    .bugspark-spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
      border-radius: 50%; animation: bugspark-spin 0.6s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }

    .bugspark-annotation-overlay {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
    }

    /* ── Annotation Toolbar ── */
    .bugspark-annotation-toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px;
      background: #1a1a2e;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-wrap: nowrap; overflow-x: auto; overflow-y: visible;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .bugspark-annotation-toolbar::-webkit-scrollbar { display: none; }

    .bugspark-annotation-toolbar__separator {
      width: 1px; height: 32px;
      background: rgba(255,255,255,0.1);
      margin: 0 4px; flex-shrink: 0;
    }

    .bugspark-toolbar-section {
      display: flex; flex-direction: row; align-items: center;
      gap: 4px; min-width: 0; flex-shrink: 0;
    }

    .bugspark-toolbar-group {
      display: flex; gap: 2px; align-items: center;
    }
    .bugspark-toolbar-group--colors {
      gap: 6px;
    }

    /* ── Tool Buttons (Pen, Arrow, Rect, Circle, Text, Blur) ── */
    .bugspark-tool-btn {
      width: 40px; height: 40px;
      border-radius: 10px; border: none;
      background: transparent;
      color: rgba(255,255,255,0.55); cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px; transition: all 0.15s ease;
      position: relative; flex-shrink: 0;
    }
    .bugspark-tool-btn:hover {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.9);
    }
    .bugspark-tool-btn:active {
      transform: scale(0.93);
    }
    .bugspark-tool-btn--active {
      background: ${primaryColor};
      color: #fff;
      box-shadow: 0 2px 10px ${primaryColor}44, 0 0 0 1px ${primaryColor}88;
    }
    .bugspark-tool-btn--active:hover {
      background: ${primaryColor}; opacity: 0.92;
    }
    .bugspark-tool-btn__icon {
      width: 18px; height: 18px; display: flex;
      align-items: center; justify-content: center;
    }
    .bugspark-tool-btn__icon svg {
      width: 18px; height: 18px;
    }
    .bugspark-tool-btn__label {
      font-size: 9px; line-height: 1; font-weight: 500;
      letter-spacing: 0.3px; opacity: 0.85;
    }

    /* ── Color Buttons ── */
    .bugspark-color-btn {
      width: 26px; height: 26px; min-width: 26px; min-height: 26px;
      border-radius: 50%; border: 2px solid rgba(255,255,255,0.12);
      cursor: pointer; transition: all 0.15s ease;
      position: relative; flex-shrink: 0;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
    }
    .bugspark-color-btn:hover {
      transform: scale(1.15);
      border-color: rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.2);
    }
    .bugspark-color-btn:active {
      transform: scale(1.05);
    }
    .bugspark-color-btn--active {
      border-color: #fff;
      transform: scale(1.2);
      box-shadow: 0 0 0 2px ${primaryColor}, 0 2px 10px rgba(0,0,0,0.5);
    }
    .bugspark-color-btn--active:hover {
      transform: scale(1.2);
    }

    /* ── Width Buttons ── */
    .bugspark-width-btn {
      width: 36px; height: 36px;
      border-radius: 8px; border: none;
      background: transparent;
      color: rgba(255,255,255,0.55); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease; flex-shrink: 0;
    }
    .bugspark-width-btn:hover {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.9);
    }
    .bugspark-width-btn:active {
      transform: scale(0.93);
    }
    .bugspark-width-btn--active {
      background: ${primaryColor};
      color: #fff;
      box-shadow: 0 2px 8px ${primaryColor}44;
    }
    .bugspark-width-btn__indicator {
      border-radius: 50%;
      background: currentColor; transition: all 0.15s ease;
    }
    .bugspark-width-btn--active .bugspark-width-btn__indicator {
      background: #fff;
    }

    /* ── Action Buttons (Undo, Done, Cancel) ── */
    .bugspark-toolbar-section--actions {
      margin-left: auto; flex-direction: row; gap: 6px; flex-shrink: 0;
    }

    .bugspark-action-btn {
      height: 36px; padding: 0 12px;
      border-radius: 8px; border: none;
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.7); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.15s ease;
      font-size: 13px; font-weight: 500; font-family: inherit;
      flex-shrink: 0;
    }
    .bugspark-action-btn svg {
      width: 16px; height: 16px;
    }
    .bugspark-action-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #fff;
    }
    .bugspark-action-btn:active {
      transform: scale(0.95);
    }
    .bugspark-action-btn__icon {
      display: flex; align-items: center; justify-content: center;
    }
    .bugspark-action-btn__icon svg {
      width: 16px; height: 16px;
    }
    .bugspark-action-btn__text {
      line-height: 1;
    }

    .bugspark-action-btn--undo {
      width: 36px; height: 36px; padding: 0;
      border-radius: 8px;
    }
    .bugspark-action-btn--done {
      background: ${primaryColor};
      color: #fff;
      padding: 0 16px;
      box-shadow: 0 2px 8px ${primaryColor}44;
    }
    .bugspark-action-btn--done:hover {
      background: ${primaryColor}; opacity: 0.9;
      box-shadow: 0 4px 14px ${primaryColor}66;
    }
    .bugspark-action-btn--cancel {
      color: rgba(255,255,255,0.5);
    }
    .bugspark-action-btn--cancel:hover {
      color: #ff6b6b; background: rgba(255,107,107,0.1);
    }

    /* ── Canvas ── */
    .bugspark-annotation-canvas-wrapper {
      flex: 1; display: flex; align-items: center; justify-content: center;
      overflow: hidden; position: relative;
      min-height: 0;
    }
    .bugspark-annotation-canvas-wrapper canvas {
      max-width: 100%; max-height: 100%; object-fit: contain;
      touch-action: none;
    }

    .bugspark-toast {
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; border-radius: 8px; font-size: 14px;
      color: white; z-index: 1000000; animation: bugspark-slideUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .bugspark-toast--success { background: #27ae60; }
    .bugspark-toast--error { background: #e94560; }
    .bugspark-toast--info { background: #3498db; }

    @media (max-width: 768px) {
      .bugspark-annotation-toolbar {
        padding: 8px 10px; gap: 4px;
      }
      .bugspark-tool-btn {
        width: 44px; height: 44px; border-radius: 10px;
      }
      .bugspark-tool-btn__icon { width: 20px; height: 20px; }
      .bugspark-tool-btn__icon svg { width: 20px; height: 20px; }
      .bugspark-tool-btn__label { font-size: 8px; }

      .bugspark-color-btn {
        width: 30px; height: 30px; min-width: 30px; min-height: 30px;
      }
      .bugspark-width-btn {
        width: 40px; height: 40px;
      }
      .bugspark-action-btn {
        height: 40px;
      }
      .bugspark-action-btn--undo {
        width: 40px; height: 40px;
      }
      .bugspark-action-btn__text { display: none; }
      .bugspark-action-btn--done,
      .bugspark-action-btn--cancel {
        width: 40px; padding: 0;
        justify-content: center;
      }
      .bugspark-toolbar-section--actions {
        margin-left: auto;
      }
    }
    @media (max-width: 640px) {
      .bugspark-modal {
        width: 100%; max-width: 100%; height: 100vh; max-height: 100vh;
        border-radius: 0;
      }
      .bugspark-field__row { flex-direction: column; gap: 0; }
      .bugspark-annotation-toolbar {
        padding: 6px 8px; gap: 3px;
      }
      .bugspark-tool-btn {
        width: 46px; height: 46px;
      }
      .bugspark-tool-btn__icon { width: 22px; height: 22px; }
      .bugspark-tool-btn__icon svg { width: 22px; height: 22px; }
      .bugspark-color-btn {
        width: 32px; height: 32px; min-width: 32px; min-height: 32px;
      }
      .bugspark-annotation-toolbar__separator {
        height: 28px; margin: 0 2px;
      }
    }
  `;
}
