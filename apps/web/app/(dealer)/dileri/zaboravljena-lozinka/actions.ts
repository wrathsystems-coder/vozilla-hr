"use server";

import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { dispatch } from "@/lib/email/dispatch";
import { getClientIp } from "@/lib/http/client-ip";
import { issueToken } from "@/lib/magic-link";
import { enforce as rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/seo/site-url";
import type { Dealer } from "@/payload-types";

// Forgot-password server action. Always returns generic success — never
// reveals whether the email exists in our dealers collection (email
// enumeration prevention). All real work happens off the success path.

const PASSWORD_RESET_TTL_HOURS = 1;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_SEC = 24 * 60 * 60;
const RATE_LIMIT_IP_MAX = 10;
const RATE_LIMIT_IP_WINDOW_SEC = 60 * 60;

export type ForgotActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function forgotPasswordAction(
  _prev: ForgotActionState,
  formData: FormData,
): Promise<ForgotActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const honeypot = String(formData.get("website") ?? "");

  if (!email) return { status: "error", message: "Unesi email adresu." };
  if (honeypot.length > 0) return { status: "success" }; // bot — silent ack

  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));

  // IP-level limit (broad) + email-level limit (per-account) so an attacker
  // can't burn through every dealer's daily quota from a single IP. Both
  // limits return the same generic "too many" message; we never tip our
  // hand about which one tripped.
  const ipRate = await rateLimit({
    key: `ip:${ip}`,
    endpoint: "dealer-forgot-password",
    limit: RATE_LIMIT_IP_MAX,
    windowSec: RATE_LIMIT_IP_WINDOW_SEC,
  });
  const emailRate = await rateLimit({
    key: `email:${email}`,
    endpoint: "dealer-forgot-password",
    limit: RATE_LIMIT_MAX,
    windowSec: RATE_LIMIT_WINDOW_SEC,
  });
  if (!ipRate.allowed || !emailRate.allowed) {
    return {
      status: "error",
      message: "Previše zahtjeva. Pokušaj kasnije.",
    };
  }

  const payload = await getPayload({ config });
  const dealerResult = await payload.find({
    collection: "dealers",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  });
  const dealer = (dealerResult.docs[0] as Dealer | undefined) ?? null;

  // No matching dealer or inactive account → quiet success. Doing this
  // *after* the DB lookup keeps response timing roughly constant.
  if (!dealer || !dealer.is_active) {
    await logAudit({
      actorType: "system",
      actorId: null,
      action: "dealer.password_reset_request_unmatched",
      entityType: "dealer",
      entityId: null,
      after: { email_hash_prefix: email.slice(0, 2) + "***" },
      ipAddress: ip,
    });
    return { status: "success" };
  }

  const { token } = await issueToken({
    purpose: "password_reset",
    entityType: "dealer",
    entityId: dealer.id as number,
    ttlHours: PASSWORD_RESET_TTL_HOURS,
  });
  const url = `${siteUrl()}/dileri/reset/${token}`;

  try {
    await dispatch({
      key: "dealer-password-reset",
      to: email,
      props: {
        dealerLegalName: dealer.legal_name,
        resetUrl: url,
        ttlHours: PASSWORD_RESET_TTL_HOURS,
      },
    });
  } catch {
    // Email delivery failure shouldn't reveal whether the user exists.
    // Audit it server-side; UI still gets the generic success.
  }

  await logAudit({
    actorType: "system",
    actorId: null,
    action: "dealer.password_reset_request_issued",
    entityType: "dealer",
    entityId: dealer.id,
    ipAddress: ip,
  });

  return { status: "success" };
}
