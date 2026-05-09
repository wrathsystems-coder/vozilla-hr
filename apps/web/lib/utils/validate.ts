import { validateOIB } from "./oib";

export { validateOIB };

const PHONE_HR_REGEX = /^(\+385|00385|0)[1-9]\d{6,8}$/;
const POSTCODE_HR_REGEX = /^[1-5]\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Disposable email domains. Sprint 4 expands this list.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
]);

export function validatePhoneHR(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, "");
  return PHONE_HR_REGEX.test(cleaned);
}

/**
 * Strict E.164 form for DB storage: "+385XXXXXXXX" (no spaces, no leading 0).
 * Returns null when input isn't a valid HR number — caller decides whether
 * to reject or fall back. Use formatPhone() in lib/utils/format.ts for
 * display formatting.
 */
export function normalizePhoneE164(phone: string): string | null {
  const cleaned = phone.replace(/[\s()-]/g, "");
  if (!PHONE_HR_REGEX.test(cleaned)) return null;
  let national: string;
  if (cleaned.startsWith("+385")) national = cleaned.slice(4);
  else if (cleaned.startsWith("00385")) national = cleaned.slice(5);
  else national = cleaned.slice(1); // leading "0"
  return `+385${national}`;
}

export function validatePostcodeHR(postcode: string): boolean {
  return POSTCODE_HR_REGEX.test(postcode.trim());
}

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: "invalid_format" | "disposable" };

export function validateEmail(email: string): EmailValidationResult {
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, reason: "invalid_format" };
  }
  const domain = email.toLowerCase().split("@")[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "disposable" };
  }
  return { valid: true };
}
