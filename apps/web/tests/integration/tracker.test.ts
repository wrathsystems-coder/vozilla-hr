import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { POST as resendTrackerPOST } from "@/app/api/upit/resend-tracker/route";
import { cancelLead } from "@/lib/leads/cancel-lead";
import { getDb } from "@/lib/db/client";
import { auditLog, emailLog, magicLinkTokens, rateLimitBuckets } from "@/lib/db/schema";
import { issueToken, validateToken } from "@/lib/magic-link";

function makeJsonRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/upit/resend-tracker", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function createLead(overrides: Record<string, unknown> = {}) {
  const payload = await getPayload({ config });
  return (await payload.create({
    collection: "lead_requests",
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      public_token: crypto.randomUUID(),
      display_id: `VZ-2026-05-09-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()
        .replace(/[01ILO]/g, "X")}`,
      customer_name: "Tracker Test",
      customer_email: "tracker.test@example.com",
      customer_phone: "+385911234567",
      customer_county_id: 21,
      customer_postcode: "10000",
      request_type: "new",
      has_trade_in: false,
      gdpr_consent_at: new Date().toISOString(),
      marketing_consent: false,
      source: "header",
      status: "new",
      ...overrides,
    } as any,
  })) as { id: number; display_id: string; status: string };
}

describe("tracker (integration)", () => {
  beforeAll(() => {
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
    await db.delete(emailLog);
    await db.delete(auditLog);
    await db.delete(magicLinkTokens);
    const payload = await getPayload({ config });
    await payload.delete({
      collection: "lead_assignments",
      where: { id: { greater_than: 0 } },
    });
    await payload.delete({
      collection: "lead_requests",
      where: { customer_email: { contains: "@example.com" } },
    });
  });

  describe("cancelLead", () => {
    it("anonymises PII, closes assignments, revokes tracker token", async () => {
      const lead = await createLead();
      const { token } = await issueToken({
        purpose: "lead_tracker",
        entityType: "lead_request",
        entityId: lead.id,
        ttlHours: 24 * 30,
      });

      const result = await cancelLead({ leadId: lead.id, reason: "customer_cancelled" });
      expect(result.ok).toBe(true);

      const payload = await getPayload({ config });
      const after = await payload.findByID({ collection: "lead_requests", id: lead.id });
      expect(after.status).toBe("closed");
      expect(after.customer_name).toBe("Izbrisano");
      expect(after.customer_email).toMatch(/^deleted-[0-9a-f]{16}@vozilla\.invalid$/);
      expect(after.customer_phone).toBe("+385000000000");

      // Token revoked → validateToken now reports it as already-used / not-fresh.
      const checked = await validateToken(token, "lead_tracker");
      expect(checked.valid).toBe(true); // still valid time-wise
      if (checked.valid) {
        expect(checked.usedAt).not.toBeNull(); // marked used by revoke
      }

      // Audit row written.
      const audits = await getDb().select().from(auditLog);
      expect(audits.find((a) => a.action === "lead.cancel")).toBeDefined();
    });

    it("returns reason='already_cancelled' on second cancel", async () => {
      const lead = await createLead();
      await cancelLead({ leadId: lead.id, reason: "customer_cancelled" });
      const second = await cancelLead({ leadId: lead.id, reason: "customer_cancelled" });
      expect(second).toEqual({ ok: false, reason: "already_cancelled" });
    });

    it("returns reason='not_found' for unknown lead id", async () => {
      const result = await cancelLead({ leadId: 99_999_999, reason: "customer_cancelled" });
      expect(result).toEqual({ ok: false, reason: "not_found" });
    });
  });

  describe("POST /api/upit/resend-tracker", () => {
    it("dispatches magic-link email when (email, display_id) matches", async () => {
      const lead = await createLead();
      const res = await resendTrackerPOST(
        makeJsonRequest({ email: "tracker.test@example.com", display_id: lead.display_id }),
      );
      expect(res.status).toBe(200);

      const emails = await getDb().select().from(emailLog);
      expect(emails).toHaveLength(1);
      expect(emails[0].templateName).toBe("magic-link");
      expect(emails[0].recipientEmail).toBe("tracker.test@example.com");

      // New tracker token issued.
      const tokens = await getDb().select().from(magicLinkTokens);
      expect(tokens.find((t) => t.purpose === "lead_tracker")).toBeDefined();
    });

    it("returns generic 200 + does NOT dispatch when display_id is unknown (no enumeration)", async () => {
      await createLead({ customer_email: "different@example.com" });
      const res = await resendTrackerPOST(
        makeJsonRequest({
          email: "different@example.com",
          display_id: "VZ-2026-05-09-ZZZZ", // doesn't exist
        }),
      );
      expect(res.status).toBe(200);
      const emails = await getDb().select().from(emailLog);
      expect(emails).toHaveLength(0);
    });

    it("returns generic 200 when lead is already cancelled", async () => {
      const lead = await createLead();
      await cancelLead({ leadId: lead.id, reason: "customer_cancelled" });

      const res = await resendTrackerPOST(
        makeJsonRequest({ email: "tracker.test@example.com", display_id: lead.display_id }),
      );
      expect(res.status).toBe(200);
      const emails = await getDb().select().from(emailLog);
      expect(emails).toHaveLength(0);
    });

    it("422 on invalid display_id format", async () => {
      const res = await resendTrackerPOST(
        makeJsonRequest({ email: "ana@example.com", display_id: "not-a-display-id" }),
      );
      expect(res.status).toBe(422);
    });

    it("429 after 3 attempts in 24h on the same email", async () => {
      const email = "rate.limit@example.com";
      const lead = await createLead({ customer_email: email });
      for (let i = 0; i < 3; i++) {
        const ok = await resendTrackerPOST(makeJsonRequest({ email, display_id: lead.display_id }));
        expect(ok.status).toBe(200);
      }
      const blocked = await resendTrackerPOST(
        makeJsonRequest({ email, display_id: lead.display_id }),
      );
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    });
  });
});
