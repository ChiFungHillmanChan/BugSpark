import type { StyleVars } from './styles-base';

export function getAnnotationStyles(vars: StyleVars): string {
  return `
    .bugspark-annotation-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
      pointer-events: auto;
    }

    /* -- Annotation Toolbar -- */
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

    /* -- Tool Buttons (Pen, Arrow, Rect, Circle, Text, Blur) -- */
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
      background: ${vars.primaryColor};
      color: #fff;
      box-shadow: 0 2px 10px ${vars.primaryColor}44, 0 0 0 1px ${vars.primaryColor}88;
    }
    .bugspark-tool-btn--active:hover {
      background: ${vars.primaryColor}; opacity: 0.92;
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

    /* -- Color Buttons -- */
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
      box-shadow: 0 0 0 2px ${vars.primaryColor}, 0 2px 10px rgba(0,0,0,0.5);
    }
    .bugspark-color-btn--active:hover {
      transform: scale(1.2);
    }

    /* -- Width Buttons -- */
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
      background: ${vars.primaryColor};
      color: #fff;
      box-shadow: 0 2px 8px ${vars.primaryColor}44;
    }
    .bugspark-width-btn__indicator {
      border-radius: 50%;
      background: currentColor; transition: all 0.15s ease;
    }
    .bugspark-width-btn--active .bugspark-width-btn__indicator {
      background: #fff;
    }

    /* -- Action Buttons (Undo, Done, Cancel) -- */
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
      background: ${vars.primaryColor};
      color: #fff;
      padding: 0 16px;
      box-shadow: 0 2px 8px ${vars.primaryColor}44;
    }
    .bugspark-action-btn--done:hover {
      background: ${vars.primaryColor}; opacity: 0.9;
      box-shadow: 0 4px 14px ${vars.primaryColor}66;
    }
    .bugspark-action-btn--cancel {
      color: rgba(255,255,255,0.5);
    }
    .bugspark-action-btn--cancel:hover {
      color: #ff6b6b; background: rgba(255,107,107,0.1);
    }

    /* -- Canvas -- */
    .bugspark-annotation-canvas-wrapper {
      flex: 1; display: flex; align-items: center; justify-content: center;
      overflow: hidden; position: relative;
      min-height: 0;
    }
    .bugspark-annotation-canvas-wrapper canvas {
      max-width: 100%; max-height: 100%; object-fit: contain;
      touch-action: none;
    }
  `;
}
