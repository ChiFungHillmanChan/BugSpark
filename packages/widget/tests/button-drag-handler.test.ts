import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enableDrag, restorePosition, clearStoredPosition } from '../src/ui/button-drag-handler';

// jsdom does not provide PointerEvent; polyfill it from MouseEvent
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init?: PointerEventInit & MouseEventInit) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 0;
      this.pointerType = init?.pointerType ?? 'mouse';
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.style.width = '56px';
  button.style.height = '56px';
  Object.defineProperty(button, 'offsetWidth', { value: 56, configurable: true });
  Object.defineProperty(button, 'offsetHeight', { value: 56, configurable: true });
  // jsdom does not implement pointer capture
  button.setPointerCapture = vi.fn();
  button.releasePointerCapture = vi.fn();
  document.body.appendChild(button);
  return button;
}

function createShadowRoot(): ShadowRoot {
  const host = document.createElement('div');
  return host.attachShadow({ mode: 'open' });
}

function createMockLocalStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key of Object.keys(store)) delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('ButtonDragHandler', () => {
  let button: HTMLButtonElement;
  let shadowRoot: ShadowRoot;
  const PROJECT_KEY = 'bsk_pub_test1234abcd';

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockLocalStorage());
    button = createButton();
    shadowRoot = createShadowRoot();
  });

  afterEach(() => {
    button.remove();
    vi.unstubAllGlobals();
  });

  describe('enableDrag', () => {
    it('returns a cleanup function', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('adds draggable class to button', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      expect(button.classList.contains('bugspark-fab--draggable')).toBe(true);
      cleanup();
    });

    it('removes draggable class on cleanup', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      cleanup();
      expect(button.classList.contains('bugspark-fab--draggable')).toBe(false);
    });

    it('does not add dragging class below threshold', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });

      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 102, clientY: 102 }));

      expect(button.classList.contains('bugspark-fab--dragging')).toBe(false);

      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanup();
    });

    it('adds dragging class above threshold', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });

      button.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 100, right: 156, bottom: 156,
        width: 56, height: 56, x: 100, y: 100, toJSON: () => ({}),
      }));

      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 140, clientY: 140 }));

      expect(button.classList.contains('bugspark-fab--dragging')).toBe(true);

      button.dispatchEvent(new PointerEvent('pointerup'));
      expect(button.classList.contains('bugspark-fab--dragging')).toBe(false);
      cleanup();
    });

    it('saves position to localStorage after drag', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });

      button.getBoundingClientRect = vi.fn(() => ({
        left: 200, top: 300, right: 256, bottom: 356,
        width: 56, height: 56, x: 200, y: 300, toJSON: () => ({}),
      }));

      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
      button.dispatchEvent(new PointerEvent('pointerup'));

      // Storage key should NOT be the old prefix-based key
      const legacyStored = localStorage.getItem('bugspark_fab_pos_bsk_pub_');
      expect(legacyStored).toBeNull();

      // Find the actual stored key (hash-based)
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!);
      const posKey = keys.find(k => k.startsWith('bugspark_fab_pos_'));
      expect(posKey).toBeDefined();
      const stored = localStorage.getItem(posKey!);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!) as { x: number; y: number };
      expect(typeof parsed.x).toBe('number');
      expect(typeof parsed.y).toBe('number');

      cleanup();
    });

    it('prevents click propagation after drag', () => {
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      const clickHandler = vi.fn();
      button.addEventListener('click', clickHandler);

      button.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 100, right: 156, bottom: 156,
        width: 56, height: 56, x: 100, y: 100, toJSON: () => ({}),
      }));

      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
      button.dispatchEvent(new PointerEvent('pointerup'));

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(clickEvent);

      expect(clickHandler).not.toHaveBeenCalled();

      button.removeEventListener('click', clickHandler);
      cleanup();
    });
  });

  describe('restorePosition', () => {
    it('returns false when no stored position', () => {
      const isRestored = restorePosition(PROJECT_KEY, button);
      expect(isRestored).toBe(false);
    });

    it('restores position from localStorage', () => {
      // First drag to persist under the new key
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      button.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 200, right: 156, bottom: 256,
        width: 56, height: 56, x: 100, y: 200, toJSON: () => ({}),
      }));
      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanup();

      // Reset button position to confirm restore works
      button.style.left = '';
      button.style.top = '';

      const isRestored = restorePosition(PROJECT_KEY, button);
      expect(isRestored).toBe(true);
      expect(button.style.left).not.toBe('');
      expect(button.style.top).not.toBe('');
    });

    it('migrates from legacy key on restore', () => {
      // Store position under the old legacy key
      localStorage.setItem('bugspark_fab_pos_bsk_pub_', JSON.stringify({ x: 100, y: 200 }));

      const isRestored = restorePosition(PROJECT_KEY, button);
      expect(isRestored).toBe(true);
      expect(button.style.left).toBe('100px');
      expect(button.style.top).toBe('200px');

      // Legacy key should be removed after migration
      expect(localStorage.getItem('bugspark_fab_pos_bsk_pub_')).toBeNull();
    });

    it('returns false for invalid stored data', () => {
      // Store invalid data under the new key by dragging then corrupting
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      button.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 100, right: 156, bottom: 156,
        width: 56, height: 56, x: 100, y: 100, toJSON: () => ({}),
      }));
      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanup();

      // Corrupt the stored value
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!);
      const posKey = keys.find(k => k.startsWith('bugspark_fab_pos_'))!;
      localStorage.setItem(posKey, 'not-json');

      const isRestored = restorePosition(PROJECT_KEY, button);
      expect(isRestored).toBe(false);
    });

    it('clamps position to viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });

      // Use legacy key to test migration + clamping
      localStorage.setItem('bugspark_fab_pos_bsk_pub_', JSON.stringify({ x: 900, y: 700 }));

      const isRestored = restorePosition(PROJECT_KEY, button);
      expect(isRestored).toBe(true);
      expect(parseInt(button.style.left)).toBeLessThanOrEqual(800 - 56);
      expect(parseInt(button.style.top)).toBeLessThanOrEqual(600 - 56);
    });
  });

  describe('clearStoredPosition', () => {
    it('removes stored position from localStorage', () => {
      // Store under both legacy and new key
      localStorage.setItem('bugspark_fab_pos_bsk_pub_', JSON.stringify({ x: 100, y: 200 }));
      const cleanup = enableDrag({ button, projectKey: PROJECT_KEY, shadowRoot });
      button.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 200, right: 156, bottom: 256,
        width: 56, height: 56, x: 100, y: 200, toJSON: () => ({}),
      }));
      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 128, clientY: 128 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanup();

      clearStoredPosition(PROJECT_KEY);

      // Both legacy and new keys should be cleared
      expect(localStorage.getItem('bugspark_fab_pos_bsk_pub_')).toBeNull();
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!);
      const posKey = keys.find(k => k.startsWith('bugspark_fab_pos_'));
      expect(posKey).toBeUndefined();
    });
  });

  describe('storage key uniqueness', () => {
    it('different project keys produce different storage keys', () => {
      const keyA = 'bsk_pub_AAAAtest1234';
      const keyB = 'bsk_pub_BBBBtest5678';

      // Drag with keyA
      const cleanupA = enableDrag({ button, projectKey: keyA, shadowRoot });
      button.getBoundingClientRect = vi.fn(() => ({
        left: 10, top: 20, right: 66, bottom: 76,
        width: 56, height: 56, x: 10, y: 20, toJSON: () => ({}),
      }));
      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 38, clientY: 48 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanupA();

      // Drag with keyB
      const cleanupB = enableDrag({ button, projectKey: keyB, shadowRoot });
      button.getBoundingClientRect = vi.fn(() => ({
        left: 300, top: 400, right: 356, bottom: 456,
        width: 56, height: 56, x: 300, y: 400, toJSON: () => ({}),
      }));
      button.dispatchEvent(new PointerEvent('pointerdown', { clientX: 328, clientY: 428 }));
      button.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 400 }));
      button.dispatchEvent(new PointerEvent('pointerup'));
      cleanupB();

      // Should have two separate storage entries
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!);
      const posKeys = keys.filter(k => k.startsWith('bugspark_fab_pos_'));
      expect(posKeys.length).toBe(2);
      expect(posKeys[0]).not.toBe(posKeys[1]);
    });
  });
});
