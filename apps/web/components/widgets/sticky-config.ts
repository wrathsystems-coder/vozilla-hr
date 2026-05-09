// Sticky widget runtime config + dismissal state. Mirrors config/widgets.yml
// + Payload WidgetSettings global; Sprint 7 polish wires the global lookup
// (currently hardcoded so the widget works without Payload at build time).

export const STICKY_CONFIG = {
  triggerDelaySec: 8,
  triggerScrollPercent: 40,
  dismissForHours: 24,
  excludedPaths: [
    "/admin",
    "/dileri",
    "/upit",
    "/zatrazi-ponudu",
    "/gdpr-zahtjev",
    "/opci-uvjeti",
    "/politika-privatnosti",
    "/politika-kolacica",
    "/impressum",
  ],
} as const;

export const DISMISS_STORAGE_KEY = "vozilla:sticky-dismissed-until";
export const PREFILL_SESSION_KEY = "vozilla:wizard-prefill";

/** Matches if `pathname` starts with any excluded prefix (segment-aware). */
export function isExcludedPath(pathname: string): boolean {
  return STICKY_CONFIG.excludedPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isDismissed(now: number, raw: string | null): boolean {
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return ts > now;
}

export function dismissUntil(now: number): number {
  return now + STICKY_CONFIG.dismissForHours * 60 * 60 * 1000;
}

export type WizardPrefill = {
  customer_email?: string;
  customer_phone?: string;
};
