import { randomBytes } from "node:crypto";
import { now } from "@/lib/utils/time";

// Public-facing lead identifier shown to customer + dealer + admin.
// Format: VZ-YYYY-MM-DD-XXXX where XXXX is 4 chars from a Crockford-ish
// alphabet (no I/L/0/1/O — easier to read aloud over phone).
//
// Collision risk: 28^4 = ~614k combinations per day. With <1k leads/day
// expected, p(collision) within a day is < 1%. The Payload UNIQUE
// constraint on display_id will surface the rare clash; caller retries.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars (no I L O 0 1)
const SUFFIX_LEN = 4;

export function generateLeadDisplayId(date: Date = now()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const bytes = randomBytes(SUFFIX_LEN);
  let suffix = "";
  for (let i = 0; i < SUFFIX_LEN; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `VZ-${yyyy}-${mm}-${dd}-${suffix}`;
}

export function isValidLeadDisplayId(value: string): boolean {
  return /^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/.test(value);
}
