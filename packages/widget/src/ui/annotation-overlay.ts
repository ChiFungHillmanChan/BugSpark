import type { AnnotationToolType } from '../types';
import * as annotationCanvas from '../core/annotation-canvas';

const PRESET_COLORS = ['#e94560', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#ffffff'];
const LINE_WIDTHS: Array<{ label: string; value: number }> = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

const TOOLS: Array<{ type: AnnotationToolType; label: string }> = [
  { type: 'pen', label: '\u270E' },
  { type: 'arrow', label: '\u2192' },
  { type: 'rectangle', label: '\u25A1' },
  { type: 'circle', label: '\u25CB' },
  { type: 'text', label: 'T' },
  { type: 'blur', label: '\u25A8' },
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
  input.style.cssText = `position:absolute;left:${x}px;top:${y}px;z-index:10000;padding:4px 8px;border:2px solid ${activeColor};border-radius:4px;font-size:14px;background:white;color:#333;outline:none;min-width:120px;`;

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
}

function createToolbar(callbacks: AnnotationOverlayCallbacks): HTMLDivElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'bugspark-annotation-toolbar';

  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.className = `bugspark-tool-btn${tool.type === activeToolType ? ' bugspark-tool-btn--active' : ''}`;
    btn.textContent = tool.label;
    btn.title = tool.type;
    btn.setAttribute('data-tool', tool.type);
    btn.addEventListener('click', () => selectTool(tool.type));
    toolbar.appendChild(btn);
  }

  toolbar.appendChild(createSeparator());

  for (const color of PRESET_COLORS) {
    const btn = document.createElement('button');
    btn.className = `bugspark-color-btn${color === activeColor ? ' bugspark-color-btn--active' : ''}`;
    btn.style.background = color;
    btn.setAttribute('data-color', color);
    btn.addEventListener('click', () => selectColor(color));
    toolbar.appendChild(btn);
  }

  toolbar.appendChild(createSeparator());

  for (const lw of LINE_WIDTHS) {
    const btn = document.createElement('button');
    btn.className = 'bugspark-tool-btn';
    btn.textContent = lw.label;
    btn.addEventListener('click', () => annotationCanvas.setLineWidth(lw.value));
    toolbar.appendChild(btn);
  }

  toolbar.appendChild(createSeparator());

  const undoBtn = document.createElement('button');
  undoBtn.className = 'bugspark-tool-btn';
  undoBtn.textContent = '\u21A9';
  undoBtn.title = 'Undo';
  undoBtn.addEventListener('click', () => annotationCanvas.undo());
  toolbar.appendChild(undoBtn);

  toolbar.appendChild(createSeparator());

  const doneBtn = document.createElement('button');
  doneBtn.className = 'bugspark-btn bugspark-btn--primary bugspark-btn--small';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => {
    const result = annotationCanvas.getAnnotatedCanvas();
    callbacks.onDone(result);
  });
  toolbar.appendChild(doneBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bugspark-btn bugspark-btn--secondary bugspark-btn--small';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', callbacks.onCancel);
  toolbar.appendChild(cancelBtn);

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

export function unmount(): void {
  if (overlayElement) {
    annotationCanvas.destroy();
    overlayElement.remove();
    overlayElement = null;
    activeToolType = 'pen';
    activeColor = PRESET_COLORS[0];
  }
}
