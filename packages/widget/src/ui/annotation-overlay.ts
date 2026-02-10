import type { AnnotationToolType } from '../types';
import * as annotationCanvas from '../core/annotation-canvas';

const PRESET_COLORS = ['#e94560', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#ffffff'];
const LINE_WIDTHS: Array<{ label: string; value: number }> = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

/**
 * SVG icons for annotation tools — crisp, consistent across all platforms.
 * Each icon is a 20x20 viewBox SVG string with stroke-based rendering.
 */
const TOOL_ICONS: Record<AnnotationToolType, string> = {
  pen: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z"/><path d="M11.5 5.5l3 3"/></svg>',
  arrow: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16L16 4"/><path d="M9 4h7v7"/></svg>',
  rectangle: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="14" height="12" rx="1.5"/></svg>',
  circle: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/></svg>',
  text: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12"/><path d="M10 5v12"/><path d="M7 17h6"/></svg>',
  blur: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h14M3 10h14M3 14h14" stroke-dasharray="2 2"/><rect x="5" y="5" width="10" height="10" rx="2" stroke-dasharray="0"/></svg>',
  none: '',
};

const ACTION_ICONS = {
  undo: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l4-4M4 8l4 4"/><path d="M4 8h9a4 4 0 010 8H11"/></svg>',
  done: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-8"/></svg>',
  cancel: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>',
};

const TOOLS: Array<{ type: AnnotationToolType; label: string }> = [
  { type: 'pen', label: 'Pen' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'rectangle', label: 'Rect' },
  { type: 'circle', label: 'Circle' },
  { type: 'text', label: 'Text' },
  { type: 'blur', label: 'Blur' },
];

let overlayElement: HTMLDivElement | null = null;
let activeToolType: AnnotationToolType = 'pen';
let activeColor = PRESET_COLORS[0];

export interface AnnotationOverlayCallbacks {
  onDone: (annotatedCanvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}

export function mount(
  root: ShadowRoot,
  screenshotCanvas: HTMLCanvasElement,
  callbacks: AnnotationOverlayCallbacks,
): void {
  if (overlayElement) return;

  overlayElement = document.createElement('div');
  overlayElement.className = 'bugspark-annotation-overlay';

  const toolbar = createToolbar(callbacks);
  overlayElement.appendChild(toolbar);

  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'bugspark-annotation-canvas-wrapper';
  const drawCanvas = document.createElement('canvas');
  canvasWrapper.appendChild(drawCanvas);
  overlayElement.appendChild(canvasWrapper);

  root.appendChild(overlayElement);

  annotationCanvas.init(drawCanvas, screenshotCanvas, handleTextInput);
  annotationCanvas.setTool('pen');
}

function handleTextInput(x: number, y: number, callback: (text: string) => void): void {
  if (!overlayElement) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'bugspark-text-input';
  input.placeholder = 'Enter text...';
  input.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    z-index: 10000;
    padding: 8px 12px;
    border: 2px solid ${activeColor};
    border-radius: 8px;
    font-size: 16px;
    background: white;
    color: #333;
    outline: none;
    min-width: 150px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  function commit(): void {
    const text = input.value.trim();
    input.remove();
    if (text) callback(text);
  }

  function cancel(): void {
    input.remove();
  }

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });

  input.addEventListener('blur', commit);

  overlayElement.appendChild(input);
  input.focus();
  
  // On mobile, ensure the input is visible and not covered by keyboard
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

function createToolbar(callbacks: AnnotationOverlayCallbacks): HTMLDivElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'bugspark-annotation-toolbar';

  // Tools section
  const toolsSection = document.createElement('div');
  toolsSection.className = 'bugspark-toolbar-section';
  const toolsGroup = document.createElement('div');
  toolsGroup.className = 'bugspark-toolbar-group';
  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.className = `bugspark-tool-btn${tool.type === activeToolType ? ' bugspark-tool-btn--active' : ''}`;
    btn.setAttribute('data-tool', tool.type);
    btn.setAttribute('aria-label', tool.label);
    btn.title = tool.label;
    const iconWrap = document.createElement('span');
    iconWrap.className = 'bugspark-tool-btn__icon';
    iconWrap.innerHTML = TOOL_ICONS[tool.type];
    btn.appendChild(iconWrap);
    const label = document.createElement('span');
    label.className = 'bugspark-tool-btn__label';
    label.textContent = tool.label;
    btn.appendChild(label);
    btn.addEventListener('click', () => selectTool(tool.type));
    toolsGroup.appendChild(btn);
  }
  toolsSection.appendChild(toolsGroup);
  toolbar.appendChild(toolsSection);

  toolbar.appendChild(createSeparator());

  // Colors section
  const colorsSection = document.createElement('div');
  colorsSection.className = 'bugspark-toolbar-section';
  const colorsGroup = document.createElement('div');
  colorsGroup.className = 'bugspark-toolbar-group bugspark-toolbar-group--colors';
  for (const color of PRESET_COLORS) {
    const btn = document.createElement('button');
    btn.className = `bugspark-color-btn${color === activeColor ? ' bugspark-color-btn--active' : ''}`;
    btn.style.background = color;
    btn.setAttribute('data-color', color);
    btn.setAttribute('aria-label', `Color ${color}`);
    btn.title = color;
    if (color === '#ffffff') {
      btn.style.border = '2px solid rgba(255,255,255,0.4)';
    }
    btn.addEventListener('click', () => selectColor(color));
    colorsGroup.appendChild(btn);
  }
  colorsSection.appendChild(colorsGroup);
  toolbar.appendChild(colorsSection);

  toolbar.appendChild(createSeparator());

  // Line width section
  const widthSection = document.createElement('div');
  widthSection.className = 'bugspark-toolbar-section';
  const widthGroup = document.createElement('div');
  widthGroup.className = 'bugspark-toolbar-group';
  const currentWidth = annotationCanvas.getLineWidth();
  for (const lw of LINE_WIDTHS) {
    const btn = document.createElement('button');
    const isActive = lw.value === currentWidth;
    btn.className = `bugspark-width-btn${isActive ? ' bugspark-width-btn--active' : ''}`;
    btn.setAttribute('data-width', lw.value.toString());
    btn.setAttribute('aria-label', lw.label);
    btn.title = lw.label;
    const indicator = document.createElement('span');
    indicator.className = 'bugspark-width-btn__indicator';
    indicator.style.width = `${Math.max(4, lw.value * 2.5)}px`;
    indicator.style.height = `${Math.max(4, lw.value * 2.5)}px`;
    btn.appendChild(indicator);
    btn.addEventListener('click', () => {
      annotationCanvas.setLineWidth(lw.value);
      updateWidthButtons(lw.value);
    });
    widthGroup.appendChild(btn);
  }
  widthSection.appendChild(widthGroup);
  toolbar.appendChild(widthSection);

  // Actions section — pushed to the right on desktop
  const actionsSection = document.createElement('div');
  actionsSection.className = 'bugspark-toolbar-section bugspark-toolbar-section--actions';

  const undoBtn = document.createElement('button');
  undoBtn.className = 'bugspark-action-btn bugspark-action-btn--undo';
  undoBtn.setAttribute('aria-label', 'Undo');
  undoBtn.title = 'Undo';
  undoBtn.innerHTML = ACTION_ICONS.undo;
  undoBtn.addEventListener('click', () => annotationCanvas.undo());
  actionsSection.appendChild(undoBtn);

  const doneBtn = document.createElement('button');
  doneBtn.className = 'bugspark-action-btn bugspark-action-btn--done';
  doneBtn.setAttribute('aria-label', 'Done');
  doneBtn.title = 'Done';
  const doneIconWrap = document.createElement('span');
  doneIconWrap.className = 'bugspark-action-btn__icon';
  doneIconWrap.innerHTML = ACTION_ICONS.done;
  doneBtn.appendChild(doneIconWrap);
  const doneLabel = document.createElement('span');
  doneLabel.className = 'bugspark-action-btn__text';
  doneLabel.textContent = 'Done';
  doneBtn.appendChild(doneLabel);
  doneBtn.addEventListener('click', () => {
    const result = annotationCanvas.getAnnotatedCanvas();
    callbacks.onDone(result);
  });
  actionsSection.appendChild(doneBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bugspark-action-btn bugspark-action-btn--cancel';
  cancelBtn.setAttribute('aria-label', 'Cancel');
  cancelBtn.title = 'Cancel';
  const cancelIconWrap = document.createElement('span');
  cancelIconWrap.className = 'bugspark-action-btn__icon';
  cancelIconWrap.innerHTML = ACTION_ICONS.cancel;
  cancelBtn.appendChild(cancelIconWrap);
  const cancelLabel = document.createElement('span');
  cancelLabel.className = 'bugspark-action-btn__text';
  cancelLabel.textContent = 'Cancel';
  cancelBtn.appendChild(cancelLabel);
  cancelBtn.addEventListener('click', callbacks.onCancel);
  actionsSection.appendChild(cancelBtn);

  toolbar.appendChild(actionsSection);

  return toolbar;
}

function createSeparator(): HTMLDivElement {
  const sep = document.createElement('div');
  sep.className = 'bugspark-annotation-toolbar__separator';
  return sep;
}

function selectTool(toolType: AnnotationToolType): void {
  activeToolType = toolType;
  annotationCanvas.setTool(toolType);
  updateToolButtons();
}

function selectColor(color: string): void {
  activeColor = color;
  annotationCanvas.setColor(color);
  updateColorButtons();
}

function updateToolButtons(): void {
  if (!overlayElement) return;
  const buttons = overlayElement.querySelectorAll('[data-tool]');
  buttons.forEach((btn) => {
    const isActive = btn.getAttribute('data-tool') === activeToolType;
    btn.className = `bugspark-tool-btn${isActive ? ' bugspark-tool-btn--active' : ''}`;
  });
}

function updateColorButtons(): void {
  if (!overlayElement) return;
  const buttons = overlayElement.querySelectorAll('[data-color]');
  buttons.forEach((btn) => {
    const isActive = btn.getAttribute('data-color') === activeColor;
    btn.className = `bugspark-color-btn${isActive ? ' bugspark-color-btn--active' : ''}`;
  });
}

function updateWidthButtons(activeWidth: number): void {
  if (!overlayElement) return;
  const buttons = overlayElement.querySelectorAll('[data-width]');
  buttons.forEach((btn) => {
    const width = parseInt(btn.getAttribute('data-width') || '0', 10);
    const isActive = width === activeWidth;
    btn.classList.toggle('bugspark-width-btn--active', isActive);
  });
}

export function unmount(): void {
  if (overlayElement) {
    annotationCanvas.destroy();
    overlayElement.remove();
    overlayElement = null;
    activeToolType = 'pen';
    activeColor = PRESET_COLORS[0];
  }
}
