let activeToast: HTMLDivElement | null = null;
let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

type ToastType = 'success' | 'error' | 'info';

export function showToast(
  root: ShadowRoot,
  message: string,
  type: ToastType = 'info',
): void {
  if (activeToast) {
    activeToast.remove();
    if (dismissTimeout) clearTimeout(dismissTimeout);
  }

  activeToast = document.createElement('div');
  activeToast.className = `bugspark-toast bugspark-toast--${type}`;
  activeToast.textContent = message;

  root.appendChild(activeToast);

  dismissTimeout = setTimeout(() => {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  }, 3000);
}
