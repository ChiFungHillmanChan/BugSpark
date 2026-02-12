export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_EMAIL_LENGTH = 254;

const HTML_TAG_PATTERN = /<[^>]*>/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeInput(value: string, maxLength: number): string {
  return value
    .trim()
    .slice(0, maxLength)
    .replace(HTML_TAG_PATTERN, '');
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_PATTERN.test(email);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters' };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title must be less than ${MAX_TITLE_LENGTH} characters` };
  }
  return { valid: true };
}

export function validateDescription(description: string): ValidationResult {
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` };
  }
  return { valid: true };
}

export function validateEmailField(email: string): ValidationResult {
  if (email && !validateEmail(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}
