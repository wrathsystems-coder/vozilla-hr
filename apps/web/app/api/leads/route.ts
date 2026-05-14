import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { logConsent } from "@/lib/consent-log";
import { dispatch } from "@/lib/email/dispatch";
import { getClientIp } from "@/lib/http/client-ip";
import { generateLeadDisplayId } from "@/lib/leads/display-id";
import { lookupIdempotent, storeIdempotent } from "@/lib/leads/idempotency";
import { issueToken } from "@/lib/magic-link";
import { enforce } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha/verify";
import { siteUrl } from "@/lib/seo/site-url";
import { normalizePhoneE164, validateEmail } from "@/lib/utils/validate";
import { now } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

const ENDPOINT = "lead.create";
const TRACKER_TTL_HOURS = 24 * 30; // 30 days
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "noreply@vozilla.hr";

// CtaSource mirror — keep in sync with lib/catalog/cta.ts and the
// LeadRequests.source enum (commit 1).
const SOURCE_VALUES = [
  "header",
  "hub",
  "brand",
  "category",
  "detail",
  "recenzija",
  "usporedba",
  "quiz",
  "leasing",
  "sticky",
  "oglas",
  "other",
] as const;

const TradeInSchema = z.object({
  brand: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  mileage_km: z.number().int().min(0).max(2_000_000).optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  estimated_value_eur: z.number().min(0).optional(),
});

const RequestBodySchema = z
  .object({
    request_type: z.enum(["new", "used", "leasing", "unsure"]),
    brand_id: z.number().int().positive().nullish(),
    model_id: z.number().int().positive().nullish(),
    version_text: z.string().max(200).optional(),
    year_from: z.number().int().min(1900).max(2100).optional(),
    year_to: z.number().int().min(1900).max(2100).optional(),
    color_preferences: z.array(z.string().max(40)).max(10).optional(),
    comments: z.string().max(2000).optional(),
    price_min: z.number().min(0).optional(),
    price_max: z.number().min(0).optional(),
    financing_type: z.enum(["cash", "bank_loan", "leasing", "undecided"]).optional(),
    leasing_type: z.enum(["operating", "financial"]).optional(),
    deposit: z.number().min(0).optional(),
    period_months: z.number().int().min(0).max(120).optional(),
    has_trade_in: z.boolean().default(false),
    trade_in_data: TradeInSchema.optional(),
    time_frame: z.enum(["immediate", "1m", "3m", "6m", "later"]).optional(),
    customer_name: z.string().min(2).max(120),
    customer_email: z.string().email().max(200),
    customer_phone: z.string().min(6).max(40),
    customer_county_id: z.number().int().min(1).max(21),
    customer_postcode: z.string().regex(/^\d{5}$/, "must be 5 digits"),
    preferred_contact_method: z.enum(["phone", "email", "whatsapp", "any"]).optional(),
    best_contact_time: z.string().max(80).optional(),
    gdpr_consent: z.literal(true, { message: "gdpr_consent must be true" }),
    marketing_consent: z.boolean().default(false),
    source: z.enum(SOURCE_VALUES).default("other"),
    recaptcha_token: z.string().min(1, "recaptcha_token required"),
    recaptcha_action: z.literal("lead_create"),
    // Honeypot — bots fill all visible inputs; legit submissions leave it empty.
    _hp_email: z.string().max(0, "honeypot triggered").optional(),
  })
  .refine((data) => data.financing_type !== "leasing" || data.leasing_type !== undefined, {
    message: "leasing_type is required when financing_type is 'leasing'",
    path: ["leasing_type"],
  })
  .refine(
    (data) =>
      data.price_min === undefined ||
      data.price_max === undefined ||
      data.price_min <= data.price_max,
    { message: "price_min must be <= price_max", path: ["price_min"] },
  );

type RequestBody = z.infer<typeof RequestBodySchema>;

function jsonResponse(status: number, body: unknown, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: extraHeaders });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? null;
  const idempotencyKey = request.headers.get("idempotency-key");

  // 1. Idempotency replay short-circuit.
  if (idempotencyKey) {
    const cached = await lookupIdempotent(idempotencyKey, ENDPOINT);
    if (cached) {
      return jsonResponse(cached.status, cached.body, { "X-Idempotent-Replay": "1" });
    }
  }

  // 2. Body parse + Zod validation. Honeypot lives inside the schema.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  const parsed = RequestBodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(422, {
      error: "validation_failed",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const body: RequestBody = parsed.data;

  // 3. Rate limit per IP (5/15min) + per email (3/15min). Either trips → 429.
  const ipLimit = await enforce({
    key: `ip:${ip}`,
    endpoint: ENDPOINT,
    limit: 5,
    windowSec: 15 * 60,
  });
  if (!ipLimit.allowed) {
    return jsonResponse(
      429,
      { error: "rate_limited", scope: "ip" },
      { "Retry-After": String(ipLimit.retryAfterSec) },
    );
  }
  const emailLimit = await enforce({
    key: `email:${body.customer_email.toLowerCase()}`,
    endpoint: ENDPOINT,
    limit: 3,
    windowSec: 15 * 60,
  });
  if (!emailLimit.allowed) {
    return jsonResponse(
      429,
      { error: "rate_limited", scope: "email" },
      { "Retry-After": String(emailLimit.retryAfterSec) },
    );
  }

  // 4. reCAPTCHA. block → reject; review → continue with status='under_review'.
  const captcha = await verifyRecaptcha({
    token: body.recaptcha_token,
    expectedAction: "lead_create",
    remoteIp: ip,
  });
  if (captcha.outcome === "block") {
    return jsonResponse(403, { error: "captcha_failed", reason: captcha.reason });
  }
  const flagReview = captcha.outcome === "review";

  // 5. Email + phone validation beyond Zod's regex.
  const emailCheck = validateEmail(body.customer_email);
  if (!emailCheck.valid) {
    return jsonResponse(422, { error: "email_invalid", reason: emailCheck.reason });
  }
  const phoneE164 = normalizePhoneE164(body.customer_phone);
  if (!phoneE164) {
    return jsonResponse(422, { error: "phone_invalid" });
  }

  // 6. Generate display_id + persist via Payload local API.
  const displayId = generateLeadDisplayId();
  const payload = await getPayload({ config });

  let leadId: number;
  try {
    const created = await payload.create({
      collection: "lead_requests",
      data: {
        public_token: crypto.randomUUID(), // placeholder UUID; tracker uses the magic-link token instead
        display_id: displayId,
        customer_name: body.customer_name,
        customer_email: body.customer_email.toLowerCase(),
        customer_phone: phoneE164,
        customer_county_id: body.customer_county_id,
        customer_postcode: body.customer_postcode,
        preferred_contact_method: body.preferred_contact_method,
        best_contact_time: body.best_contact_time,
        request_type: body.request_type,
        brand: body.brand_id ?? undefined,
        model: body.model_id ?? undefined,
        version_text: body.version_text,
        year_from: body.year_from,
        year_to: body.year_to,
        color_preferences: body.color_preferences?.map((color) => ({ color })),
        comments: body.comments,
        price_min: body.price_min,
        price_max: body.price_max,
        financing_type: body.financing_type,
        leasing_type: body.leasing_type,
        deposit: body.deposit,
        period_months: body.period_months,
        has_trade_in: body.has_trade_in,
        trade_in_data: body.has_trade_in ? body.trade_in_data : undefined,
        time_frame: body.time_frame,
        gdpr_consent_at: now().toISOString(),
        marketing_consent: body.marketing_consent,
        source: body.source,
        recaptcha_score: captcha.score,
        recaptcha_action: captcha.action,
        ip_address: ip,
        user_agent: userAgent,
        status: flagReview ? "under_review" : "new",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      overrideAccess: true,
    });
    leadId = created.id as number;
  } catch (err) {
    console.error("lead.create: Payload create failed", err);
    return jsonResponse(500, { error: "persist_failed" });
  }

  // 7. Magic-link tracker token (TTL 30d).
  const { token: trackerToken } = await issueToken({
    purpose: "lead_tracker",
    entityType: "lead_request",
    entityId: leadId,
    ttlHours: TRACKER_TTL_HOURS,
  });
  const trackerUrl = `${siteUrl()}/upit/${trackerToken}`;

  // 8. Consent + audit logs (sequential — they're cheap and we want
  // ordering deterministic for tests).
  await logConsent({
    email: body.customer_email.toLowerCase(),
    type: "oup",
    granted: true,
    sourceForm: "lead_request_wizard",
    ipAddress: ip,
    userAgent,
  });
  if (body.marketing_consent) {
    await logConsent({
      email: body.customer_email.toLowerCase(),
      type: "marketing",
      granted: true,
      sourceForm: "lead_request_wizard",
      ipAddress: ip,
      userAgent,
    });
  }
  await logAudit({
    actorType: "customer",
    actorId: body.customer_email.toLowerCase(),
    action: "lead.create",
    entityType: "lead_request",
    entityId: leadId,
    after: { display_id: displayId, status: flagReview ? "under_review" : "new" },
    ipAddress: ip,
  });

  // 9. Dispatch confirmation + admin notification. Failures are non-fatal —
  // the lead is already persisted; email-log captures the failure for retry.
  const brandLabel = await brandNameFor(payload, body.brand_id ?? null);
  const modelLabel = await modelNameFor(payload, body.model_id ?? null);
  await Promise.allSettled([
    dispatch({
      key: "lead-confirmation",
      to: body.customer_email,
      props: {
        customerName: body.customer_name,
        displayId,
        trackerUrl,
        preferredContactMethod: body.preferred_contact_method ?? "any",
      },
    }),
    dispatch({
      key: "admin-new-lead-notification",
      to: ADMIN_NOTIFY_EMAIL,
      props: {
        displayId,
        customerName: body.customer_name,
        brand: brandLabel,
        model: modelLabel,
        recaptchaScore: captcha.score,
        source: body.source,
        adminUrl: `${siteUrl()}/admin/lead-dispatch/${leadId}`,
        flagReview,
      },
    }),
  ]);

  // 10. Build response, cache for idempotent replay.
  const responseBody = {
    display_id: displayId,
    tracker_url: trackerUrl,
    flagged_for_review: flagReview,
  };
  if (idempotencyKey) {
    await storeIdempotent({
      key: idempotencyKey,
      endpoint: ENDPOINT,
      status: 201,
      body: responseBody,
    });
  }
  return jsonResponse(201, responseBody);
}

async function brandNameFor(
  payload: Awaited<ReturnType<typeof getPayload>>,
  brandId: number | null,
): Promise<string | null> {
  if (!brandId) return null;
  try {
    const doc = await payload.findByID({ collection: "brands", id: brandId, depth: 0 });
    return (doc?.name as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function modelNameFor(
  payload: Awaited<ReturnType<typeof getPayload>>,
  modelId: number | null,
): Promise<string | null> {
  if (!modelId) return null;
  try {
    const doc = await payload.findByID({ collection: "models", id: modelId, depth: 0 });
    return (doc?.name as string | undefined) ?? null;
  } catch {
    return null;
  }
}
