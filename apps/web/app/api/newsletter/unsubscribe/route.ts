import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isEnabled } from "@/lib/feature-flags";
import { logConsent } from "@/lib/consent-log";
import { getClientIp } from "@/lib/http/client-ip";
import { unsubscribe as unsubscribeAction, verifyUnsubscribeSignature } from "@/lib/newsletter";
import { enforce } from "@/lib/rate-limit";

// One-click unsubscribe via HMAC-signed URL from the newsletter footer.
// Gated on feature-flags.yml `newsletter`; when off, returns 503 so any
// stale link cached by an email client also no-ops.
//
// Accepts both POST (form submit from /odjava-newslettera) and GET (the
// "one-click" link itself) — Gmail and some clients deep-link straight
// to the URL without rendering a confirm page.

export const dynamic = "force-dynamic";

const ENDPOINT = "newsletter.unsubscribe";

const BodySchema = z.object({
  email: z.string().email().max(200),
  sig: z.string().min(1).max(200),
});

async function handle(email: string, sig: string, ip: string, userAgent: string | null) {
  if (!isEnabled("newsletter")) {
    return NextResponse.json({ error: "newsletter_disabled" }, { status: 503 });
  }

  const limit = await enforce({
    key: `ip:${ip}`,
    endpoint: ENDPOINT,
    limit: 20,
    windowSec: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (!verifyUnsubscribeSignature(email, sig)) {
    // Signature mismatch — invalid or tampered link. Generic 400 (don't
    // reveal whether the email exists).
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const result = await unsubscribeAction(email);

  // Log every successful state change regardless of branch — analytics
  // care about "user said stop", not whether they were already off.
  if (result.status === "ok") {
    await logConsent({
      email: email.toLowerCase(),
      type: "marketing",
      granted: false,
      sourceForm: "newsletter_unsubscribe",
      ipAddress: ip,
      userAgent,
    });
  }

  return NextResponse.json({ status: result.status }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 });
  }
  return handle(parsed.data.email, parsed.data.sig, ip, request.headers.get("user-agent"));
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const params = request.nextUrl.searchParams;
  const email = params.get("email") ?? "";
  const sig = params.get("sig") ?? "";
  if (!email || !sig) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  return handle(email, sig, ip, request.headers.get("user-agent"));
}
