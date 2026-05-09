import { randomBytes } from "node:crypto";
import { now } from "@/lib/utils/time";

// GDPR-YYYY-XXXX display id, customer-visible. Same Crockford-ish alphabet
// as lib/leads/display-id.ts so the two never get confused (no I/L/0/1/O).
// Year-only granularity since GDPR volume is low — collision risk over a
// year (28^4 = ~614k combos) stays well under 1% even at 10k/year.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SUFFIX_LEN = 4;

export function generateGdprDisplayId(date: Date = now()): string {
  const yyyy = date.getUTCFullYear();
  const bytes = randomBytes(SUFFIX_LEN);
  let suffix = "";
  for (let i = 0; i < SUFFIX_LEN; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `GDPR-${yyyy}-${suffix}`;
}

export function isValidGdprDisplayId(value: string): boolean {
  return /^GDPR-\d{4}-[A-Z2-9]{4}$/.test(value);
}
