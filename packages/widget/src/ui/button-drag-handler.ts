const DRAG_THRESHOLD = 5;
const STORAGE_KEY_PREFIX = 'bugspark_fab_pos_';

export interface DragConfig {
  button: HTMLButtonElement;
  projectKey: string;
  shadowRoot: ShadowRoot;
}

interface StoredPosition {
  x: number;
  y: number;
}

function getStorageKey(projectKey: string): string {
  return `${STORAGE_KEY_PREFIX}${projectKey.slice(0, 8)}`;
}

function clampX(x: number, buttonWidth: number): number {
  return Math.max(0, Math.min(window.innerWidth - buttonWidth, x));
}

function clampY(y: number, buttonHeight: number): number {
  return Math.max(0, Math.min(window.innerHeight - buttonHeight, y));
}

function applyPosition(button: HTMLButtonElement, x: number, y: number): void {
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.right = 'auto';
  button.style.bottom = 'auto';
}

export function restorePosition(projectKey: string, button: HTMLButtonElement): boolean {
  try {
    const stored = localStorage.getItem(getStorageKey(projectKey));
    if (!stored) return false;

    const position = JSON.parse(stored) as StoredPosition;
    if (typeof position.x !== 'number' || typeof position.y !== 'number') return false;

    const clampedX = clampX(position.x, button.offsetWidth);
    const clampedY = clampY(position.y, button.offsetHeight);
    applyPosition(button, clampedX, clampedY);
    return true;
  } catch {
    return false;
  }
}

export function clearStoredPosition(projectKey: string): void {
  try {
    localStorage.removeItem(getStorageKey(projectKey));
  } catch {
    // localStorage may be unavailable
  }
}

export function enableDrag(config: DragConfig): () => void {
  const { button, projectKey } = config;

  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  button.classList.add('bugspark-fab--draggable');

  function handlePointerDown(e: PointerEvent): void {
    isDragging = true;
    hasMoved = false;

    const rect = button.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    button.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent): void {
    if (!isDragging) return;

    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (!hasMoved && deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
      return;
    }

    hasMoved = true;
    button.classList.add('bugspark-fab--dragging');

    // Remove corner position classes so they don't conflict with inline positioning
    const classes = button.className;
    const positionClassMatch = classes.match(/bugspark-fab--\w+-\w+/);
    if (positionClassMatch && !positionClassMatch[0].includes('dragg')) {
      button.classList.remove(positionClassMatch[0]);
    }

    const x = clampX(e.clientX - offsetX, button.offsetWidth);
    const y = clampY(e.clientY - offsetY, button.offsetHeight);
    applyPosition(button, x, y);
  }

  function handlePointerUp(): void {
    if (!isDragging) return;
    isDragging = false;
    button.classList.remove('bugspark-fab--dragging');

    if (hasMoved) {
      const rect = button.getBoundingClientRect();
      try {
        localStorage.setItem(
          getStorageKey(projectKey),
          JSON.stringify({ x: rect.left, y: rect.top }),
        );
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  function handleClick(e: MouseEvent): void {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function handleResize(): void {
    const rect = button.getBoundingClientRect();
    const x = clampX(rect.left, button.offsetWidth);
    const y = clampY(rect.top, button.offsetHeight);

    if (x !== rect.left || y !== rect.top) {
      applyPosition(button, x, y);
    }
  }

  button.addEventListener('pointerdown', handlePointerDown);
  button.addEventListener('pointermove', handlePointerMove);
  button.addEventListener('pointerup', handlePointerUp);
  button.addEventListener('click', handleClick, true);
  window.addEventListener('resize', handleResize);

  return function cleanup(): void {
    button.removeEventListener('pointerdown', handlePointerDown);
    button.removeEventListener('pointermove', handlePointerMove);
    button.removeEventListener('pointerup', handlePointerUp);
    button.removeEventListener('click', handleClick, true);
    window.removeEventListener('resize', handleResize);
    button.classList.remove('bugspark-fab--draggable', 'bugspark-fab--dragging');
  };
}
