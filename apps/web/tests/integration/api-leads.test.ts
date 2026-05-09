import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/leads/route";
import { getDb } from "@/lib/db/client";
import {
  auditLog,
  consentLog,
  emailLog,
  idempotencyKeys,
  magicLinkTokens,
  rateLimitBuckets,
} from "@/lib/db/schema";
import { getPayload } from "payload";
import config from "@payload-config";

const ENDPOINT_URL = "http://localhost/api/leads";

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request(ENDPOINT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "10.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    request_type: "new",
    customer_name: "Ana Anić",
    customer_email: "ana.test@example.com",
    customer_phone: "0911234567",
    customer_county_id: 21,
    customer_postcode: "10000",
    has_trade_in: false,
    gdpr_consent: true,
    marketing_consent: false,
    source: "header",
    recaptcha_token: "test-token",
    recaptcha_action: "lead_create",
    ...overrides,
  };
}

describe("POST /api/leads (integration)", () => {
  beforeAll(() => {
    // Force reCAPTCHA into dev_bypass for the whole suite (no live Google call).
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    // Same for Resend — keep dispatch on the dev-mock path.
    vi.stubEnv("RESEND_API_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    const db = getDb();
    // Wipe operational tables. Payload-managed lead_requests rows we leave;
    // each test uses a unique email so the rate-limiter doesn't carry over.
    await db.delete(rateLimitBuckets);
    await db.delete(idempotencyKeys);
    await db.delete(consentLog);
    await db.delete(auditLog);
    await db.delete(emailLog);
    await db.delete(magicLinkTokens);
  });

  afterEach(async () => {
    // Drop any lead rows the test created so the suite stays self-contained.
    const payload = await getPayload({ config });
    await payload.delete({
      collection: "lead_requests",
      where: { customer_email: { contains: "@example.com" } },
    });
  });

  it("happy path: 201 + display_id + tracker_url, persists lead + token + logs + emails", async () => {
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.display_id).toMatch(/^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/);
    expect(body.tracker_url).toContain("/upit/");
    expect(body.flagged_for_review).toBe(false);

    // Lead persisted with normalized phone + lowercased email.
    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "lead_requests",
      where: { display_id: { equals: body.display_id } },
      limit: 1,
    });
    expect(found.docs).toHaveLength(1);
    expect(found.docs[0].customer_phone).toBe("+385911234567");
    expect(found.docs[0].customer_email).toBe("ana.test@example.com");
    expect(found.docs[0].source).toBe("header");
    expect(found.docs[0].status).toBe("new");

    // Magic-link token issued.
    const tokens = await getDb().select().from(magicLinkTokens);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].purpose).toBe("lead_tracker");
    expect(tokens[0].relatedEntityType).toBe("lead_request");

    // Consent + audit logged.
    const consents = await getDb().select().from(consentLog);
    expect(consents.find((c) => c.consentType === "oup")).toBeDefined();
    const audits = await getDb().select().from(auditLog);
    expect(audits.find((a) => a.action === "lead.create")).toBeDefined();

    // Two emails dispatched (customer + admin).
    const emails = await getDb().select().from(emailLog);
    const templateNames = emails.map((e) => e.templateName).sort();
    expect(templateNames).toEqual(["admin-new-lead-notification", "lead-confirmation"]);
  });

  it("marketing_consent=true logs both oup and marketing consent rows", async () => {
    await POST(makeRequest(validBody({ marketing_consent: true })));
    const consents = await getDb().select().from(consentLog);
    const types = consents.map((c) => c.consentType).sort();
    expect(types).toEqual(["marketing", "oup"]);
  });

  it("422 on missing required field (customer_email)", async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).customer_email;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("validation_failed");
  });

  it("422 on gdpr_consent=false (literal true required)", async () => {
    const res = await POST(makeRequest(validBody({ gdpr_consent: false })));
    expect(res.status).toBe(422);
  });

  it("422 honeypot trips when _hp_email is non-empty", async () => {
    const res = await POST(makeRequest(validBody({ _hp_email: "spam@bot.com" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.issues.some((i: { path: string }) => i.path === "_hp_email")).toBe(true);
  });

  it("422 disposable email", async () => {
    const res = await POST(makeRequest(validBody({ customer_email: "x@mailinator.com" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("email_invalid");
    expect(json.reason).toBe("disposable");
  });

  it("422 invalid HR phone", async () => {
    const res = await POST(makeRequest(validBody({ customer_phone: "+44 20 7946 0958" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("phone_invalid");
  });

  it("422 leasing_type required when financing_type=leasing", async () => {
    const res = await POST(
      makeRequest(validBody({ financing_type: "leasing" /* leasing_type omitted */ })),
    );
    expect(res.status).toBe(422);
  });

  it("422 price_min > price_max", async () => {
    const res = await POST(makeRequest(validBody({ price_min: 50000, price_max: 10000 })));
    expect(res.status).toBe(422);
  });

  it("429 IP rate limit after 5 submissions in 15min", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(validBody({ customer_email: `iprl${i}@example.com` })));
      expect(res.status).toBe(201);
    }
    const blocked = await POST(
      makeRequest(validBody({ customer_email: "iprl-blocked@example.com" })),
    );
    expect(blocked.status).toBe(429);
    const json = await blocked.json();
    expect(json.scope).toBe("ip");
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("idempotent replay returns the same body without creating a new lead", async () => {
    const key = "idem-test-1234";
    const first = await POST(makeRequest(validBody(), { "idempotency-key": key }));
    expect(first.status).toBe(201);
    const firstBody = await first.json();

    const replay = await POST(makeRequest(validBody(), { "idempotency-key": key }));
    expect(replay.status).toBe(201);
    expect(replay.headers.get("X-Idempotent-Replay")).toBe("1");
    const replayBody = await replay.json();
    expect(replayBody.display_id).toBe(firstBody.display_id);

    // Only one lead persisted.
    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "lead_requests",
      where: { display_id: { equals: firstBody.display_id } },
    });
    expect(found.docs).toHaveLength(1);
  });

  it("source defaults to 'other' when omitted", async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).source;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(201);
    const json = await res.json();
    const payload = await getPayload({ config });
    const [doc] = (
      await payload.find({
        collection: "lead_requests",
        where: { display_id: { equals: json.display_id } },
      })
    ).docs;
    expect(doc.source).toBe("other");
  });
});
