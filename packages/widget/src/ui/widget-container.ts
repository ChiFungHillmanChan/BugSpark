import type { BugSparkBranding } from '../types';
import { getStyles } from './styles';

let hostElement: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let styleElement: HTMLStyleElement | null = null;

export function mount(primaryColor: string, theme: 'light' | 'dark' | 'auto', branding?: BugSparkBranding): void {
  if (hostElement) return;

  hostElement = document.createElement('div');
  hostElement.id = 'bugspark-host';

  // Inline styles with !important to resist host-page CSS overrides.
  // The host element lives in the light DOM, so any host-page rule
  // (`div {}`, `* {}`, resets, Tailwind preflight, etc.) can target it.
  // These styles ensure the element never affects page layout and always
  // renders above everything. Max z-index = 2147483647.
  hostElement.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:0',
    'height:0',
    'overflow:visible',
    'z-index:2147483647',
    'pointer-events:none',
    'padding:0',
    'margin:0',
    'border:none',
    'background:none',
    'opacity:1',
    'transform:none',
    'isolation:isolate',
    'contain:layout style',
  ].map(s => s + ' !important').join(';');

  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  styleElement = document.createElement('style');
  const resolvedTheme = resolveTheme(theme);
  styleElement.textContent = getStyles(primaryColor, resolvedTheme, branding);
  shadowRoot.appendChild(styleElement);

  document.body.appendChild(hostElement);
}

export function getRoot(): ShadowRoot {
  if (!shadowRoot) {
    throw new Error('[BugSpark] Widget container not mounted');
  }
  return shadowRoot;
}

export function updateTheme(primaryColor: string, theme: 'light' | 'dark' | 'auto', branding?: BugSparkBranding): void {
  if (styleElement) {
    const resolvedTheme = resolveTheme(theme);
    styleElement.textContent = getStyles(primaryColor, resolvedTheme, branding);
  }
}

export function unmount(): void {
  if (hostElement) {
    hostElement.remove();
    hostElement = null;
    shadowRoot = null;
    styleElement = null;
  }
}

function resolveTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}
