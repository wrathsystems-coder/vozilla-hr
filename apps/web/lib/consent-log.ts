import { getDb } from "@/lib/db/client";
import { consentLog } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Mirrors consentTypeEnum in lib/db/schema/consentLog.ts. Spec:
// docs/spec/02-legal-and-compliance.md "Cookies — strategija" + GDPR
// privola logging. One row per (email, consent type, source form, timestamp)
// — never UPSERT, the audit value is the timeline.
export type ConsentType =
  | "oup"
  | "marketing"
  | "cookies_functional"
  | "cookies_analytics"
  | "cookies_marketing";

export type LogConsentArgs = {
  email: string;
  type: ConsentType;
  granted: boolean;
  /** Form / surface that captured the consent — e.g. "lead_request_wizard", "gdpr_request", "newsletter_signup". */
  sourceForm: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logConsent(args: LogConsentArgs): Promise<void> {
  await getDb()
    .insert(consentLog)
    .values({
      customerEmail: args.email,
      consentType: args.type,
      granted: args.granted,
      sourceForm: args.sourceForm,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
      timestamp: now(),
    });
}
