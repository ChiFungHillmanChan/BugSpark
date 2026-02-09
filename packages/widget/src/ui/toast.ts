let activeToast: HTMLDivElement | null = null;
let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

type ToastType = 'success' | 'error' | 'info';

export function showToast(
  root: ShadowRoot,
  message: string,
  type: ToastType = 'info',
): void {
  dismiss();

  activeToast = document.createElement('div');
  activeToast.className = `bugspark-toast bugspark-toast--${type}`;
  activeToast.textContent = message;

  root.appendChild(activeToast);

  dismissTimeout = setTimeout(() => {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
    dismissTimeout = null;
  }, 3000);
}

export function dismiss(): void {
  if (dismissTimeout) {
    clearTimeout(dismissTimeout);
    dismissTimeout = null;
  }
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
}
