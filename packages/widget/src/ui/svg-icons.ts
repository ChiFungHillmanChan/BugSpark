import type { AnnotationToolType } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgElement(strokeWidth: string, linecap?: string, linejoin?: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth);
  if (linecap) svg.setAttribute('stroke-linecap', linecap);
  if (linejoin) svg.setAttribute('stroke-linejoin', linejoin);
  return svg;
}

function createPath(d: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  return path;
}

function createPenIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round', 'round');
  svg.appendChild(createPath('M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z'));
  svg.appendChild(createPath('M11.5 5.5l3 3'));
  return svg;
}

function createArrowIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round', 'round');
  svg.appendChild(createPath('M4 16L16 4'));
  svg.appendChild(createPath('M9 4h7v7'));
  return svg;
}

function createRectangleIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round', 'round');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', '3');
  rect.setAttribute('y', '4');
  rect.setAttribute('width', '14');
  rect.setAttribute('height', '12');
  rect.setAttribute('rx', '1.5');
  svg.appendChild(rect);
  return svg;
}

function createCircleIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5');
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '10');
  circle.setAttribute('cy', '10');
  circle.setAttribute('r', '7');
  svg.appendChild(circle);
  return svg;
}

function createTextIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round', 'round');
  svg.appendChild(createPath('M4 5h12'));
  svg.appendChild(createPath('M10 5v12'));
  svg.appendChild(createPath('M7 17h6'));
  return svg;
}

function createBlurIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round');
  const dashedPath = createPath('M3 6h14M3 10h14M3 14h14');
  dashedPath.setAttribute('stroke-dasharray', '2 2');
  svg.appendChild(dashedPath);
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', '5');
  rect.setAttribute('y', '5');
  rect.setAttribute('width', '10');
  rect.setAttribute('height', '10');
  rect.setAttribute('rx', '2');
  rect.setAttribute('stroke-dasharray', '0');
  svg.appendChild(rect);
  return svg;
}

export function createUndoIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round', 'round');
  svg.appendChild(createPath('M4 8l4-4M4 8l4 4'));
  svg.appendChild(createPath('M4 8h9a4 4 0 010 8H11'));
  return svg;
}

export function createDoneIcon(): SVGSVGElement {
  const svg = createSvgElement('2', 'round', 'round');
  svg.appendChild(createPath('M4 10l4 4 8-8'));
  return svg;
}

export function createCancelIcon(): SVGSVGElement {
  const svg = createSvgElement('1.5', 'round');
  svg.appendChild(createPath('M5 5l10 10M15 5L5 15'));
  return svg;
}

export const ICON_FACTORIES: Record<Exclude<AnnotationToolType, 'none'>, () => SVGSVGElement> = {
  pen: createPenIcon,
  arrow: createArrowIcon,
  rectangle: createRectangleIcon,
  circle: createCircleIcon,
  text: createTextIcon,
  blur: createBlurIcon,
};
