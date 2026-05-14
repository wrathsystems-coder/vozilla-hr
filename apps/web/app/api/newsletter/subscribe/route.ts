import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dispatch } from "@/lib/email/dispatch";
import { isEnabled } from "@/lib/feature-flags";
import { getClientIp } from "@/lib/http/client-ip";
import { CONFIRMATION_TTL_HOURS, subscribe as subscribeAction } from "@/lib/newsletter";
import { logConsent } from "@/lib/consent-log";
import { enforce } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha/verify";
import { siteUrl } from "@/lib/seo/site-url";
import { validateEmail } from "@/lib/utils/validate";

// Newsletter subscribe. Gated on feature-flags.yml `newsletter`. When the
// flag is false, the endpoint returns 503 and no DB row is created — this
// is the "complete-but-disabled" pipeline state from the MVP spec.

export const dynamic = "force-dynamic";

const ENDPOINT = "newsletter.subscribe";

const BodySchema = z.object({
  email: z.string().email().max(200),
  /** Optional — we may have it from a "lead → newsletter cross-sell" form. */
  name: z.string().max(120).optional(),
  /** Where the signup originated — footer, home cta, settings page later. */
  source_form: z.string().min(2).max(40),
  recaptcha_token: z.string().min(1),
  recaptcha_action: z.literal("newsletter_subscribe"),
  /** Honeypot — bots fill all visible inputs; legit submissions leave empty. */
  _hp_email: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  if (!isEnabled("newsletter")) {
    return NextResponse.json({ error: "newsletter_disabled" }, { status: 503 });
  }

  const ip = getClientIp(request);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }
  const body = parsed.data;

  // Rate limit: per-IP 10/h discourages signup spam from a single source;
  // per-email 3/h prevents inbox abuse when someone enters a victim's
  // email (the confirm-link gate makes this mostly harmless, but we
  // still don't want to send 100 confirm emails to one person).
  const ipLimit = await enforce({
    key: `ip:${ip}`,
    endpoint: ENDPOINT,
    limit: 10,
    windowSec: 60 * 60,
  });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", scope: "ip" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }
  const emailLimit = await enforce({
    key: `email:${body.email.toLowerCase()}`,
    endpoint: ENDPOINT,
    limit: 3,
    windowSec: 60 * 60,
  });
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", scope: "email" },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
    );
  }

  const captcha = await verifyRecaptcha({
    token: body.recaptcha_token,
    expectedAction: "newsletter_subscribe",
    remoteIp: ip,
  });
  if (captcha.outcome === "block") {
    return NextResponse.json({ error: "captcha_failed", reason: captcha.reason }, { status: 403 });
  }

  const emailCheck = validateEmail(body.email);
  if (!emailCheck.valid) {
    return NextResponse.json(
      { error: "email_invalid", reason: emailCheck.reason },
      { status: 422 },
    );
  }

  const result = await subscribeAction({
    email: body.email,
    sourceForm: body.source_form,
    ipAddress: ip,
  });

  // Consent ledger — log every signup attempt regardless of UPSERT branch
  // so the GDPR audit trail captures the user's choice. The same email
  // re-subscribing after an unsubscribe gets a fresh "marketing granted"
  // row, leaving the historic "marketing denied" row intact.
  if (result.status !== "already_active") {
    await logConsent({
      email: body.email.toLowerCase(),
      type: "marketing",
      granted: true,
      sourceForm: body.source_form,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    });
  }

  if (result.status === "queued" || result.status === "pending_resent") {
    const confirmUrl = `${siteUrl()}/odjava-newslettera?confirm=${encodeURIComponent(result.confirmationToken)}`;
    try {
      await dispatch({
        key: "newsletter-confirm",
        to: body.email,
        props: {
          recipientName: body.name ?? "",
          confirmUrl,
          ttlHours: CONFIRMATION_TTL_HOURS,
        },
      });
    } catch (err) {
      // Email delivery failed — we still keep the pending row; the user
      // can re-submit. Log server-side; UI gets generic success.
      console.error("[newsletter.subscribe] dispatch failed", err);
    }
  }

  // Always return the same generic success to avoid email enumeration
  // (same response whether new, pending-resent, or already-active).
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
