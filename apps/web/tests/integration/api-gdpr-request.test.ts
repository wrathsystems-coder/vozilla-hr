import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/gdpr-request/route";
import { getDb } from "@/lib/db/client";
import { auditLog, emailLog, idempotencyKeys, rateLimitBuckets } from "@/lib/db/schema";
import { getPayload } from "payload";
import config from "@payload-config";

const URL = "http://localhost/api/gdpr-request";

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "10.0.0.7",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    customer_name: "Ana Anić",
    customer_email: "ana.gdpr@example.com",
    request_type: "erasure",
    gdpr_consent: true,
    recaptcha_token: "test",
    recaptcha_action: "gdpr_request",
    ...overrides,
  };
}

describe("POST /api/gdpr-request (integration)", () => {
  beforeAll(() => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
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
    await db.delete(rateLimitBuckets);
    await db.delete(idempotencyKeys);
    await db.delete(auditLog);
    await db.delete(emailLog);
    const payload = await getPayload({ config });
    await payload.delete({
      collection: "gdpr_requests",
      where: { customer_email: { contains: "@example.com" } },
    });
    await payload.delete({
      collection: "lead_requests",
      where: { customer_email: { contains: "@example.com" } },
    });
  });

  it("happy path: 201 + display_id, persists request, dispatches confirmation email", async () => {
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.display_id).toMatch(/^GDPR-\d{4}-[A-Z2-9]{4}$/);
    expect(body.status).toBe("pending");

    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "gdpr_requests",
      where: { display_id: { equals: body.display_id } },
    });
    expect(found.docs).toHaveLength(1);
    expect(found.docs[0].status).toBe("pending");
    expect(found.docs[0].request_type).toBe("erasure");

    const emails = await getDb().select().from(emailLog);
    expect(emails).toHaveLength(1);
    expect(emails[0].templateName).toBe("gdpr-request-received");

    const audits = await getDb().select().from(auditLog);
    expect(audits.find((a) => a.action === "gdpr.create")).toBeDefined();
  });

  it("links to existing lead_request when display_id is provided", async () => {
    const payload = await getPayload({ config });
    // Seed a lead.
    const lead = (await payload.create({
      collection: "lead_requests",
      overrideAccess: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        public_token: crypto.randomUUID(),
        display_id: "VZ-2026-05-09-LINK",
        customer_name: "Tester",
        customer_email: "linked.lead@example.com",
        customer_phone: "+385911234567",
        customer_county_id: 21,
        customer_postcode: "10000",
        request_type: "new",
        has_trade_in: false,
        gdpr_consent_at: new Date().toISOString(),
        marketing_consent: false,
        source: "header",
        status: "new",
      } as any,
    })) as { id: number; display_id: string };

    const res = await POST(
      makeRequest(
        validBody({
          customer_email: "linked.gdpr@example.com",
          lead_request_display_id: lead.display_id,
        }),
      ),
    );
    expect(res.status).toBe(201);
    const responseBody = await res.json();

    const found = await payload.find({
      collection: "gdpr_requests",
      where: { display_id: { equals: responseBody.display_id } },
      depth: 0,
    });
    const link = found.docs[0].lead_request;
    expect(typeof link === "number" ? link : link?.id).toBe(lead.id);
  });

  it("422 on invalid OIB checksum", async () => {
    const res = await POST(makeRequest(validBody({ customer_oib: "12345678900" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("validation_failed");
    expect(
      json.issues.some((i: { path: string; message: string }) => i.path === "customer_oib"),
    ).toBe(true);
  });

  it("422 honeypot trips when _hp_email is non-empty", async () => {
    const res = await POST(makeRequest(validBody({ _hp_email: "spam@bot.com" })));
    expect(res.status).toBe(422);
  });

  it("422 disposable email", async () => {
    const res = await POST(makeRequest(validBody({ customer_email: "x@mailinator.com" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("email_invalid");
  });

  it("422 on missing required field (request_type)", async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).request_type;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(422);
  });

  it("422 on gdpr_consent=false", async () => {
    const res = await POST(makeRequest(validBody({ gdpr_consent: false })));
    expect(res.status).toBe(422);
  });

  it("429 per-email after 3 attempts in 24h", async () => {
    const email = "rate.limit.gdpr@example.com";
    for (let i = 0; i < 3; i++) {
      const ok = await POST(makeRequest(validBody({ customer_email: email })));
      expect(ok.status).toBe(201);
    }
    const blocked = await POST(makeRequest(validBody({ customer_email: email })));
    expect(blocked.status).toBe(429);
    const json = await blocked.json();
    expect(json.scope).toBe("email");
  });

  it("idempotent replay returns the same response without creating a second row", async () => {
    const key = "gdpr-idem-1";
    const first = await POST(makeRequest(validBody(), { "idempotency-key": key }));
    expect(first.status).toBe(201);
    const firstBody = await first.json();

    const replay = await POST(makeRequest(validBody(), { "idempotency-key": key }));
    expect(replay.status).toBe(201);
    expect(replay.headers.get("X-Idempotent-Replay")).toBe("1");
    const replayBody = await replay.json();
    expect(replayBody.display_id).toBe(firstBody.display_id);

    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "gdpr_requests",
      where: { display_id: { equals: firstBody.display_id } },
    });
    expect(found.docs).toHaveLength(1);
    void eq;
  });
});
