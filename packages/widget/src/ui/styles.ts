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
    .bugspark-annotation-toolbar {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      background: ${isDark ? '#0f172a' : '#ffffff'}; 
      border-bottom: 1px solid ${borderColor};
      flex-wrap: wrap; overflow-x: auto; overflow-y: visible;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: ${borderColor} transparent;
    }
    .bugspark-annotation-toolbar::-webkit-scrollbar {
      height: 4px;
    }
    .bugspark-annotation-toolbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .bugspark-annotation-toolbar::-webkit-scrollbar-thumb {
      background: ${borderColor}; border-radius: 2px;
    }
    .bugspark-annotation-toolbar__separator {
      width: 1px; height: 40px; background: ${borderColor}; 
      margin: 0 4px; flex-shrink: 0;
    }
    .bugspark-toolbar-section {
      display: flex; flex-direction: column; gap: 8px; min-width: 0;
    }
    .bugspark-toolbar-section__label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; color: ${isDark ? '#94a3b8' : '#64748b'};
      margin-bottom: -4px;
    }
    .bugspark-toolbar-group {
      display: flex; gap: 6px; align-items: center;
    }
    .bugspark-toolbar-group--colors {
      gap: 8px;
    }
    .bugspark-tool-btn {
      min-width: 44px; min-height: 44px; padding: 8px 12px;
      border-radius: 8px; border: 1.5px solid ${borderColor};
      background: ${isDark ? '#1e293b' : '#f8fafc'}; 
      color: ${textColor}; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; transition: all 0.2s ease; font-size: 12px;
      font-weight: 500; position: relative;
    }
    .bugspark-tool-btn:hover {
      background: ${isDark ? '#334155' : '#e2e8f0'}; 
      border-color: ${primaryColor};
      transform: translateY(-1px);
    }
    .bugspark-tool-btn--active {
      background: ${primaryColor}; border-color: ${primaryColor}; 
      color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .bugspark-tool-btn--active:hover {
      background: ${primaryColor}; opacity: 0.9;
    }
    .bugspark-tool-btn__icon {
      font-size: 18px; line-height: 1;
    }
    .bugspark-tool-btn__label {
      font-size: 10px; line-height: 1;
    }
    .bugspark-color-btn {
      width: 36px; height: 36px; min-width: 36px; min-height: 36px;
      border-radius: 50%; border: 3px solid ${isDark ? '#334155' : '#e2e8f0'};
      cursor: pointer; transition: all 0.2s ease;
      position: relative; flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .bugspark-color-btn:hover {
      transform: scale(1.1); border-color: ${isDark ? '#475569' : '#cbd5e1'};
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .bugspark-color-btn--active {
      border-color: white; transform: scale(1.15);
      box-shadow: 0 0 0 2px ${primaryColor}, 0 2px 8px rgba(0,0,0,0.4);
    }
    .bugspark-width-btn {
      min-width: 44px; min-height: 44px; padding: 8px 12px;
      border-radius: 8px; border: 1.5px solid ${borderColor};
      background: ${isDark ? '#1e293b' : '#f8fafc'}; 
      color: ${textColor}; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.2s ease; font-size: 12px;
      font-weight: 500;
    }
    .bugspark-width-btn:hover {
      background: ${isDark ? '#334155' : '#e2e8f0'}; 
      border-color: ${primaryColor};
    }
    .bugspark-width-btn--active {
      background: ${primaryColor}; border-color: ${primaryColor}; 
      color: white;
    }
    .bugspark-width-btn__indicator {
      width: 4px; height: 4px; border-radius: 50%;
      background: currentColor; transition: all 0.2s ease;
    }
    .bugspark-width-btn--active .bugspark-width-btn__indicator {
      background: white;
    }
    .bugspark-width-btn__label {
      font-size: 10px; line-height: 1;
    }
    .bugspark-toolbar-section--actions {
      margin-left: auto; flex-direction: row; gap: 8px;
    }
    .bugspark-action-btn {
      min-width: 44px; min-height: 44px; padding: 10px;
      border-radius: 8px; border: 1.5px solid ${borderColor};
      background: ${isDark ? '#1e293b' : '#f8fafc'}; 
      color: ${textColor}; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease; font-size: 18px;
    }
    .bugspark-action-btn:hover {
      background: ${isDark ? '#334155' : '#e2e8f0'}; 
      border-color: ${primaryColor};
    }
    .bugspark-action-btn__icon {
      line-height: 1;
    }
    .bugspark-btn--done, .bugspark-btn--cancel {
      min-width: 80px; min-height: 44px; padding: 10px 20px;
      font-weight: 600;
    }
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
        padding: 12px; gap: 8px; flex-wrap: nowrap; overflow-x: auto;
      }
      .bugspark-toolbar-section {
        flex-shrink: 0;
      }
      .bugspark-toolbar-section__label {
        font-size: 10px;
      }
      .bugspark-tool-btn {
        min-width: 48px; min-height: 48px; padding: 6px 8px;
      }
      .bugspark-tool-btn__icon {
        font-size: 20px;
      }
      .bugspark-tool-btn__label {
        font-size: 9px;
      }
      .bugspark-color-btn {
        width: 40px; height: 40px; min-width: 40px; min-height: 40px;
      }
      .bugspark-width-btn {
        min-width: 48px; min-height: 48px; padding: 6px 8px;
      }
      .bugspark-action-btn {
        min-width: 48px; min-height: 48px;
      }
      .bugspark-btn--done, .bugspark-btn--cancel {
        min-width: 70px; padding: 10px 16px; font-size: 13px;
      }
      .bugspark-toolbar-section--actions {
        margin-left: 0; flex-shrink: 0;
      }
    }
    @media (max-width: 640px) {
      .bugspark-modal {
        width: 100%; max-width: 100%; height: 100vh; max-height: 100vh;
        border-radius: 0;
      }
      .bugspark-field__row { flex-direction: column; gap: 0; }
      .bugspark-annotation-toolbar {
        padding: 10px; gap: 6px;
      }
      .bugspark-tool-btn {
        min-width: 52px; min-height: 52px;
      }
      .bugspark-color-btn {
        width: 44px; height: 44px; min-width: 44px; min-height: 44px;
      }
    }
  `;
}
