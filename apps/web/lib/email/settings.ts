import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { EmailSetting } from "@/payload-types";

// EmailSettings global — fetched once per request scope and cached for
// 1h under the 'email_settings' tag. The Payload afterChange hook calls
// revalidateTag('email_settings') so admin saves propagate immediately.
//
// Caller (dispatch.ts) reads:
//   - per-template `enabled` (when false, dispatch is skipped + console.info)
//   - per-template `subject_override` (when non-empty, overrides default)
//   - top-level `from_email` (falls back to RESEND_FROM_EMAIL env)
//   - top-level `reply_to` (passed to Resend as replyTo)

const ONE_HOUR = 3600;

export type EmailTemplateKey =
  | "lead-confirmation"
  | "lead-to-dealer"
  | "magic-link"
  | "gdpr-request-received"
  | "gdpr-request-resolved"
  | "dealer-password-reset"
  | "admin-new-lead-notification"
  | "admin-new-gdpr-notification"
  | "dealer-reminder-1"
  | "dealer-reminder-2"
  | "customer-feedback-3d"
  | "customer-feedback-14d"
  | "customer-feedback-30d"
  | "newsletter-confirm";

export type EmailSettingsResolved = {
  fromEmail: string | null;
  replyTo: string | null;
  /** key → { enabled, subjectOverride } */
  templates: Partial<
    Record<EmailTemplateKey, { enabled: boolean; subjectOverride: string | null }>
  >;
};

const FALLBACK: EmailSettingsResolved = {
  fromEmail: null,
  replyTo: null,
  templates: {},
};

function nonEmpty(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

async function loadEmailSettings(): Promise<EmailSettingsResolved> {
  try {
    const p = await getPayload({ config });
    const g = (await p.findGlobal({ slug: "email_settings" })) as EmailSetting;

    const templates: EmailSettingsResolved["templates"] = {};
    for (const row of g.templates ?? []) {
      // Last write wins on duplicates — Payload UI shouldn't allow them
      // but the array field doesn't enforce uniqueness.
      templates[row.key] = {
        enabled: row.enabled !== false, // default true when null/undefined
        subjectOverride: nonEmpty(row.subject_override),
      };
    }

    return {
      fromEmail: nonEmpty(g.from_email),
      replyTo: nonEmpty(g.reply_to),
      templates,
    };
  } catch {
    // No DB / global never saved / Payload booting — dispatch falls back
    // to env-only defaults so first dev boot still works.
    return FALLBACK;
  }
}

const getEmailSettingsCached = unstable_cache(loadEmailSettings, ["email:settings"], {
  tags: ["email_settings"],
  revalidate: ONE_HOUR,
});

/**
 * Fetches EmailSettings via Next's ISR cache when running inside a request
 * scope (production / dev / build), falls back to a direct load when called
 * from outside the request lifecycle (vitest integration tests, ad-hoc
 * scripts) — unstable_cache throws "Invariant: incrementalCache missing"
 * in that case, which would otherwise break every dispatch() consumer.
 */
export async function getEmailSettings(): Promise<EmailSettingsResolved> {
  try {
    return await getEmailSettingsCached();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("incrementalCache")) {
      return loadEmailSettings();
    }
    // Some other unexpected throw — surface so the test/build fails loudly.
    throw err;
  }
}

/**
 * Returns per-template state with enabled-default-true semantics so the
 * admin only has to flip switches for templates they want OFF (rather
 * than have to enable every template after a fresh boot).
 */
export function resolveTemplate(
  settings: EmailSettingsResolved,
  key: EmailTemplateKey,
): { enabled: boolean; subjectOverride: string | null } {
  return settings.templates[key] ?? { enabled: true, subjectOverride: null };
}
