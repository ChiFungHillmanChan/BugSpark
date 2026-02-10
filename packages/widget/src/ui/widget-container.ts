import type { BugSparkBranding } from '../types';
import { getStyles } from './styles';

let hostElement: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let styleElement: HTMLStyleElement | null = null;

export function mount(primaryColor: string, theme: 'light' | 'dark' | 'auto', branding?: BugSparkBranding): void {
  if (hostElement) return;

  hostElement = document.createElement('div');
  hostElement.id = 'bugspark-host';
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

function resolveTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' | 'auto' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}
