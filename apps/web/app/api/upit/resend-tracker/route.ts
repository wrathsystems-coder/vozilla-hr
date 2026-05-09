import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import config from "@payload-config";
import { dispatch } from "@/lib/email/dispatch";
import { getClientIp } from "@/lib/http/client-ip";
import { isValidLeadDisplayId } from "@/lib/leads/display-id";
import { issueToken } from "@/lib/magic-link";
import { enforce } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-dynamic";

const ENDPOINT = "tracker.resend";
const TRACKER_TTL_HOURS = 24 * 30;

const BodySchema = z.object({
  email: z.string().email().max(200),
  display_id: z.string().refine(isValidLeadDisplayId, "invalid_display_id"),
});

// Generic 200 response on every code path that doesn't trip rate-limit —
// stops account-enumeration attacks. We only ever say "ako kombinacija
// postoji, poslali smo email."
const GENERIC_OK = {
  ok: true,
  message: "Ako kombinacija postoji, poslali smo novi tracking link na taj email.",
};

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
  const { email, display_id } = parsed.data;
  const lowercaseEmail = email.toLowerCase();

  // Rate limit per email — 3/24h. Keeps a guesser from harvesting valid
  // (email, display_id) pairs.
  const rl = await enforce({
    key: `email:${lowercaseEmail}`,
    endpoint: ENDPOINT,
    limit: 3,
    windowSec: 24 * 60 * 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "lead_requests",
    where: {
      and: [{ display_id: { equals: display_id } }, { customer_email: { equals: lowercaseEmail } }],
    },
    depth: 0,
    limit: 1,
  });
  const lead = result.docs[0];

  // No match (or already cancelled) → still return 200 generic.
  if (!lead || lead.status === "closed") {
    return NextResponse.json(GENERIC_OK);
  }

  const { token } = await issueToken({
    purpose: "lead_tracker",
    entityType: "lead_request",
    entityId: lead.id,
    ttlHours: TRACKER_TTL_HOURS,
  });
  const trackerUrl = `${siteUrl()}/upit/${token}`;

  await dispatch({
    key: "magic-link",
    to: lowercaseEmail,
    props: {
      recipientName: (lead.customer_name as string) || "kupče",
      subject: `Tvoj novi tracking link za upit ${display_id}`,
      heading: "Novi tracking link",
      explanation: `Tražio/la si novi link za praćenje upita ${display_id}. Klikni dolje da otvoriš stranicu.`,
      url: trackerUrl,
      ttlHours: TRACKER_TTL_HOURS,
    },
  });

  void ip; // currently unused — kept in scope for Sprint 5 audit-log entry.
  return NextResponse.json(GENERIC_OK);
}
