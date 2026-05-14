import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { dispatch } from "@/lib/email/dispatch";
import { maskEmail } from "@/lib/email/mask";
import { siteUrl } from "@/lib/seo/site-url";
import { generateGdprDisplayId } from "@/lib/gdpr/display-id";
import { getClientIp } from "@/lib/http/client-ip";
import { isValidLeadDisplayId } from "@/lib/leads/display-id";
import { lookupIdempotent, storeIdempotent } from "@/lib/leads/idempotency";
import { enforce } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha/verify";
import { validateEmail, validateOIB } from "@/lib/utils/validate";

export const dynamic = "force-dynamic";

const ENDPOINT = "gdpr.create";
const RESOLUTION_DAYS = 30;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "noreply@vozilla.hr";

const REQUEST_TYPES = ["access", "erasure", "rectification", "portability", "objection"] as const;

const BodySchema = z.object({
  customer_name: z.string().min(2).max(120),
  customer_email: z.string().email().max(200),
  customer_oib: z
    .string()
    .max(11)
    .optional()
    .refine((v) => !v || validateOIB(v), { message: "invalid_oib_checksum" }),
  request_type: z.enum(REQUEST_TYPES),
  lead_request_display_id: z
    .string()
    .max(40)
    .optional()
    .refine((v) => !v || isValidLeadDisplayId(v), { message: "invalid_lead_display_id" }),
  description: z.string().max(1000).optional(),
  gdpr_consent: z.literal(true, { message: "gdpr_consent must be true" }),
  recaptcha_token: z.string().min(1),
  recaptcha_action: z.literal("gdpr_request"),
  // Honeypot — bots fill all visible inputs; legit submissions leave it empty.
  _hp_email: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const idempotencyKey = request.headers.get("idempotency-key");

  if (idempotencyKey) {
    const cached = await lookupIdempotent(idempotencyKey, ENDPOINT);
    if (cached) {
      return NextResponse.json(cached.body, {
        status: cached.status,
        headers: { "X-Idempotent-Replay": "1" },
      });
    }
  }

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

  // Rate-limit per email — 3/24h. GDPR endpoint has lower legitimate traffic
  // than lead-create, so the per-email cap is the dominant signal; per-IP
  // gets the same loose 24h window to discourage scripted submissions.
  const ipLimit = await enforce({
    key: `ip:${ip}`,
    endpoint: ENDPOINT,
    limit: 5,
    windowSec: 24 * 60 * 60,
  });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", scope: "ip" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }
  const emailLimit = await enforce({
    key: `email:${body.customer_email.toLowerCase()}`,
    endpoint: ENDPOINT,
    limit: 3,
    windowSec: 24 * 60 * 60,
  });
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", scope: "email" },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
    );
  }

  const captcha = await verifyRecaptcha({
    token: body.recaptcha_token,
    expectedAction: "gdpr_request",
    remoteIp: ip,
  });
  if (captcha.outcome === "block") {
    return NextResponse.json({ error: "captcha_failed", reason: captcha.reason }, { status: 403 });
  }

  const emailCheck = validateEmail(body.customer_email);
  if (!emailCheck.valid) {
    return NextResponse.json(
      { error: "email_invalid", reason: emailCheck.reason },
      { status: 422 },
    );
  }

  const payload = await getPayload({ config });

  // If the customer references a specific lead, link it. Lookup is best-
  // effort — invalid pointer doesn't block the GDPR request from being
  // recorded, since the right exists regardless of whether we can match it.
  let leadRequestId: number | null = null;
  if (body.lead_request_display_id) {
    const result = await payload.find({
      collection: "lead_requests",
      where: { display_id: { equals: body.lead_request_display_id } },
      limit: 1,
      depth: 0,
    });
    leadRequestId = (result.docs[0]?.id as number | undefined) ?? null;
  }

  const displayId = generateGdprDisplayId();

  let createdId: number;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      display_id: displayId,
      customer_email: body.customer_email.toLowerCase(),
      customer_name: body.customer_name,
      customer_oib: body.customer_oib,
      request_type: body.request_type,
      lead_request: leadRequestId,
      description: body.description,
      status: "pending",
      ip_address: ip,
      recaptcha_score: captcha.score,
    };
    const created = await payload.create({
      collection: "gdpr_requests",
      overrideAccess: true,
      data: createData,
    });
    createdId = created.id as number;
  } catch (err) {
    console.error("gdpr.create: Payload create failed", err);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  // Audit trail. consent_log enum doesn't have a "gdpr_processing" value
  // and adding one is a schema migration we'll batch with Sprint 7 polish;
  // the audit row plus the gdpr_consent_at column on lead_requests cover
  // the regulatory paper-trail in the meantime.
  await logAudit({
    actorType: "customer",
    actorId: body.customer_email.toLowerCase(),
    action: "gdpr.create",
    entityType: "gdpr_request",
    entityId: createdId,
    after: {
      display_id: displayId,
      request_type: body.request_type,
      lead_request_id: leadRequestId,
    },
    ipAddress: ip,
  });

  await Promise.all([
    dispatch({
      key: "gdpr-request-received",
      to: body.customer_email,
      props: {
        customerName: body.customer_name,
        displayId,
        requestType: body.request_type,
        resolutionDays: RESOLUTION_DAYS,
      },
    }),
    dispatch({
      key: "admin-new-gdpr-notification",
      to: ADMIN_NOTIFY_EMAIL,
      props: {
        displayId,
        requestType: body.request_type,
        customerEmailMasked: maskEmail(body.customer_email.toLowerCase()),
        linkedLeadId: leadRequestId,
        resolutionDays: RESOLUTION_DAYS,
        adminUrl: `${siteUrl()}/admin/collections/gdpr_requests/${createdId}`,
      },
    }),
  ]);

  const responseBody = { display_id: displayId, status: "pending" };
  if (idempotencyKey) {
    await storeIdempotent({
      key: idempotencyKey,
      endpoint: ENDPOINT,
      status: 201,
      body: responseBody,
    });
  }
  return NextResponse.json(responseBody, { status: 201 });
}
