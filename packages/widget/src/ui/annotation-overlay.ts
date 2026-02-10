import type { AnnotationToolType } from '../types';
import * as annotationCanvas from '../core/annotation-canvas';

const PRESET_COLORS = ['#e94560', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#ffffff'];
const LINE_WIDTHS: Array<{ label: string; value: number }> = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

const TOOLS: Array<{ type: AnnotationToolType; label: string; icon: string }> = [
  { type: 'pen', label: 'Pen', icon: '\u270E' },
  { type: 'arrow', label: 'Arrow', icon: '\u2192' },
  { type: 'rectangle', label: 'Rectangle', icon: '\u25A1' },
  { type: 'circle', label: 'Circle', icon: '\u25CB' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'blur', label: 'Blur', icon: '\u25A8' },
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
  const toolsLabel = document.createElement('span');
  toolsLabel.className = 'bugspark-toolbar-section__label';
  toolsLabel.textContent = 'Tools';
  toolsSection.appendChild(toolsLabel);
  const toolsGroup = document.createElement('div');
  toolsGroup.className = 'bugspark-toolbar-group';
  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.className = `bugspark-tool-btn${tool.type === activeToolType ? ' bugspark-tool-btn--active' : ''}`;
    btn.setAttribute('data-tool', tool.type);
    btn.setAttribute('aria-label', tool.label);
    btn.title = tool.label;
    const icon = document.createElement('span');
    icon.className = 'bugspark-tool-btn__icon';
    icon.textContent = tool.icon;
    btn.appendChild(icon);
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
  const colorsLabel = document.createElement('span');
  colorsLabel.className = 'bugspark-toolbar-section__label';
  colorsLabel.textContent = 'Color';
  colorsSection.appendChild(colorsLabel);
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
      btn.style.border = '1px solid rgba(255,255,255,0.3)';
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
  const widthLabel = document.createElement('span');
  widthLabel.className = 'bugspark-toolbar-section__label';
  widthLabel.textContent = 'Width';
  widthSection.appendChild(widthLabel);
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
    indicator.style.width = `${Math.max(4, lw.value * 2)}px`;
    indicator.style.height = `${Math.max(4, lw.value * 2)}px`;
    btn.appendChild(indicator);
    const label = document.createElement('span');
    label.className = 'bugspark-width-btn__label';
    label.textContent = lw.label;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      annotationCanvas.setLineWidth(lw.value);
      updateWidthButtons(lw.value);
    });
    widthGroup.appendChild(btn);
  }
  widthSection.appendChild(widthGroup);
  toolbar.appendChild(widthSection);

  toolbar.appendChild(createSeparator());

  // Actions section
  const actionsSection = document.createElement('div');
  actionsSection.className = 'bugspark-toolbar-section bugspark-toolbar-section--actions';
  const undoBtn = document.createElement('button');
  undoBtn.className = 'bugspark-action-btn bugspark-action-btn--undo';
  undoBtn.setAttribute('aria-label', 'Undo');
  undoBtn.title = 'Undo';
  const undoIcon = document.createElement('span');
  undoIcon.className = 'bugspark-action-btn__icon';
  undoIcon.textContent = '\u21A9';
  undoBtn.appendChild(undoIcon);
  undoBtn.addEventListener('click', () => annotationCanvas.undo());
  actionsSection.appendChild(undoBtn);

  const doneBtn = document.createElement('button');
  doneBtn.className = 'bugspark-btn bugspark-btn--primary bugspark-btn--done';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => {
    const result = annotationCanvas.getAnnotatedCanvas();
    callbacks.onDone(result);
  });
  actionsSection.appendChild(doneBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bugspark-btn bugspark-btn--secondary bugspark-btn--cancel';
  cancelBtn.textContent = 'Cancel';
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
