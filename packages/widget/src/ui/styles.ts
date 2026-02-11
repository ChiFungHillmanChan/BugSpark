import type { BugSparkBranding } from '../types';
import { computeStyleVars, getBaseStyles } from './styles-base';
import { getModalStyles } from './styles-modal';
import { getAnnotationStyles } from './styles-annotation';
import { getResponsiveStyles } from './styles-responsive';

export { computeStyleVars, getBaseStyles } from './styles-base';
export type { StyleVars } from './styles-base';
export { getModalStyles } from './styles-modal';
export { getAnnotationStyles } from './styles-annotation';
export { getResponsiveStyles } from './styles-responsive';

export function getStyles(primaryColor: string, theme: 'light' | 'dark' | 'auto', branding?: BugSparkBranding): string {
  const vars = computeStyleVars(primaryColor, theme, branding);
  return getBaseStyles(vars) + getModalStyles(vars) + getAnnotationStyles(vars) + getResponsiveStyles();
}
