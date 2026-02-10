function createBugIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '28');
  svg.setAttribute('fill', 'white');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M12 2C10.9 2 10 2.9 10 4H8C8 2.9 7.1 2 6 2V4H4.5C3.67 4 3 4.67 3 5.5V7C3 8.1 3.9 9 5 9V10C5 10.55 5.45 11 6 11V9H8V14.26C8 14.74 8.33 15.15 8.79 15.27L10 15.57V16H14V15.57L15.21 15.27C15.67 15.15 16 14.74 16 14.26V9H18V11C18.55 11 19 10.55 19 10V9C20.1 9 21 8.1 21 7V5.5C21 4.67 20.33 4 19.5 4H18V2C16.9 2 16 2.9 16 4H14C14 2.9 13.1 2 12 2ZM5 7V5.5C5 5.22 5.22 5 5.5 5H18.5C18.78 5 19 5.22 19 5.5V7H5ZM10 9H14V13.5L12 14L10 13.5V9Z');

  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M3 13V15C3 16.1 3.9 17 5 17H6V19C6 19.55 6.45 20 7 20H8V17.5L10 18V20H14V18L16 17.5V20H17C17.55 20 18 19.55 18 19V17H19C20.1 17 21 16.1 21 15V13H19V15H5V13H3Z');

  svg.appendChild(path1);
  svg.appendChild(path2);
  return svg;
}

let buttonElement: HTMLButtonElement | null = null;

export function mount(
  root: ShadowRoot,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
  onClick: () => void,
  buttonText?: string,
): void {
  if (buttonElement) return;

  buttonElement = document.createElement('button');
  buttonElement.className = `bugspark-fab bugspark-fab--${position}`;
  buttonElement.appendChild(createBugIcon());
  buttonElement.setAttribute('aria-label', 'Report a bug');
  buttonElement.addEventListener('click', onClick);

  if (buttonText) {
    const textSpan = document.createElement('span');
    textSpan.textContent = buttonText;
    textSpan.style.cssText = 'color: white; font-size: 14px; font-weight: 500; margin-left: 8px;';
    buttonElement.appendChild(textSpan);
    buttonElement.style.borderRadius = '28px';
    buttonElement.style.padding = '0 16px';
    buttonElement.style.width = 'auto';
  }

  root.appendChild(buttonElement);
}

export function show(): void {
  if (buttonElement) {
    buttonElement.style.display = 'flex';
  }
}

export function hide(): void {
  if (buttonElement) {
    buttonElement.style.display = 'none';
  }
}

export function unmount(): void {
  if (buttonElement) {
    buttonElement.remove();
    buttonElement = null;
  }
}
