export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export const PASSWORD_RULE =
  'At least 8 characters, with a lowercase letter, an uppercase letter and a number.';

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return {
    hasMinLength,
    hasLower,
    hasUpper,
    hasNumber,
    isValid: hasMinLength && hasLower && hasUpper && hasNumber,
  };
}

export function passwordError(value: string): string | undefined {
  const missing: string[] = [];
  if (!/[a-z]/.test(value)) missing.push('a lowercase letter');
  if (!/[A-Z]/.test(value)) missing.push('an uppercase letter');
  if (!/[0-9]/.test(value)) missing.push('a number');
  const tooShort = value.length < 8;
  if (!tooShort && missing.length === 0) return undefined;
  const parts = [...(tooShort ? ['at least 8 characters'] : []), ...missing];
  const list =
    parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
      : parts[0];
  return `Your password needs ${list}.`;
}

export const LATIN_NAME_MESSAGE =
  'Please enter your name in Latin letters exactly as on your passport (accents are fine).';

export function hasNonLatinLetters(value: string | null | undefined): boolean {
  if (!value) return false;
  return Array.from(value).some(
    (ch) => /\p{L}/u.test(ch) && !/[\p{Script=Latin}\p{Script=Common}]/u.test(ch)
  );
}

export function latinNameError(value: string | null | undefined): string | undefined {
  return hasNonLatinLetters(value) ? LATIN_NAME_MESSAGE : undefined;
}

export const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;
export const PHONE_ERROR =
  'Enter a valid phone number with country code (8–15 digits total).';

export function normalizePhone(raw: string): string {
  return raw.trim().replace(/[\s\-().]/g, '');
}

export function phoneError(raw: string): string | undefined {
  return PHONE_REGEX.test(normalizePhone(raw)) ? undefined : PHONE_ERROR;
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase();
}
