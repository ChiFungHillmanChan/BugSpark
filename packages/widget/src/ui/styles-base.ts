import type { BugSparkBranding } from '../types';

export interface StyleVars {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  inputBg: string;
  overlayBg: string;
  surfaceBg: string;
}

export function computeStyleVars(
  primaryColor: string,
  theme: 'light' | 'dark' | 'auto',
  branding?: BugSparkBranding,
): StyleVars {
  const isDark = theme === 'dark';
  return {
    primaryColor,
    bgColor: branding?.customColors?.background ?? (isDark ? '#1a1a2e' : '#ffffff'),
    textColor: branding?.customColors?.text ?? (isDark ? '#e0e0e0' : '#333333'),
    borderColor: branding?.customColors?.border ?? (isDark ? '#333355' : '#e0e0e0'),
    inputBg: isDark ? '#16213e' : '#f8f8f8',
    overlayBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    surfaceBg: isDark ? '#16213e' : '#f5f5f5',
  };
}

export function getBaseStyles(vars: StyleVars): string {
  return `
    :host {
      all: initial;
      display: block !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 0 !important; height: 0 !important;
      overflow: visible !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      contain: style;
      isolation: isolate;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes bugspark-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bugspark-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bugspark-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes bugspark-spin { to { transform: rotate(360deg); } }

    .bugspark-fab {
      position: fixed; width: 56px; height: 56px; border-radius: 50%;
      background: ${vars.primaryColor}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 2147483647;
      transition: transform 0.2s, box-shadow 0.2s;
      pointer-events: auto;
    }
    .bugspark-fab:hover { animation: bugspark-pulse 1s ease-in-out infinite; box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
    .bugspark-fab svg { width: 28px; height: 28px; fill: white; }
    .bugspark-fab--bottom-right { bottom: 24px; right: 24px; }
    .bugspark-fab--bottom-left { bottom: 24px; left: 24px; }
    .bugspark-fab--top-right { top: 24px; right: 24px; }
    .bugspark-fab--top-left { top: 24px; left: 24px; }
    .bugspark-fab--draggable { transition: box-shadow 0.2s; cursor: grab; touch-action: none; user-select: none; }
    .bugspark-fab--dragging { cursor: grabbing; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }

    .bugspark-overlay {
      position: fixed; inset: 0; background: ${vars.overlayBg};
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483647; animation: bugspark-fadeIn 0.2s ease;
      pointer-events: auto;
    }

    .bugspark-toast {
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; border-radius: 8px; font-size: 14px;
      color: white; z-index: 2147483647; animation: bugspark-slideUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: auto;
    }
    .bugspark-toast--success { background: #27ae60; }
    .bugspark-toast--error { background: #e94560; }
    .bugspark-toast--info { background: #3498db; }

    .bugspark-watermark {
      text-align: center;
      padding: 8px 0 4px;
      font-size: 11px;
    }
    .bugspark-watermark a {
      color: #999;
      text-decoration: none;
    }
    .bugspark-watermark a:hover {
      color: #666;
      text-decoration: underline;
    }
  `;
}
