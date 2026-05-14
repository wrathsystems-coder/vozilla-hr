/**
 * Masks an email address for use in admin notifications and audit
 * surfaces where a fully recognizable customer email is not strictly
 * needed — keeps the local part hint ("an") + masks the rest while
 * preserving the domain. The customer's full identity is one click
 * away in the admin panel; we just want a useful hint in the inbox.
 *
 *   "ana.anic@example.hr"  →  "an***@example.hr"
 *   "x@example.hr"         →  "x***@example.hr"
 */
export function maskEmail(email: string): string {
  const idx = email.indexOf("@");
  if (idx < 0) return "***";
  const local = email.slice(0, idx);
  const domain = email.slice(idx + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
