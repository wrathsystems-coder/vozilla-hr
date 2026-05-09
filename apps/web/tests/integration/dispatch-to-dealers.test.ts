import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPayload } from "payload";
import config from "@payload-config";
import { dispatchToDealers } from "@/lib/leads/dispatch-to-dealers";
import { getDb } from "@/lib/db/client";
import { auditLog, emailLog } from "@/lib/db/schema";

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
      customer_name: "Dispatch Tester",
      customer_email: "dispatch.test@example.com",
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
  })) as { id: number; status: string };
}

// MOD 11-10 OIB checksum so each test dealer gets a unique-but-valid OIB
// without clashing with the seeded fixtures.
let _oibCounter = 9000000000;
function nextValidOib(): string {
  const base = String(++_oibCounter).padStart(10, "0");
  let remainder = 10;
  for (let i = 0; i < 10; i++) {
    remainder += Number(base[i]);
    remainder %= 10;
    if (remainder === 0) remainder = 10;
    remainder *= 2;
    remainder %= 11;
  }
  const checksum = (11 - remainder) % 10;
  return `${base}${checksum}`;
}

async function createDealer(overrides: Record<string, unknown> = {}) {
  const payload = await getPayload({ config });
  return (await payload.create({
    collection: "dealers",
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      slug: `dispatch-${Math.random().toString(36).slice(2, 8)}`,
      legal_name: "Dispatch Test Dealer d.o.o.",
      oib: nextValidOib(),
      email: `dispatch+${Math.random().toString(36).slice(2, 8)}@example.com`,
      password: "DispatchPass123!",
      phone: "+385911000000",
      address: {
        street: "Ulica 1",
        city: "Zagreb",
        postcode: "10000",
        county_id: 21,
        lat: 45.815,
        lng: 15.9819,
      },
      scoring: { monthly_lead_cap: 20, current_month_leads: 0 },
      is_active: true,
      is_verified: true,
      is_demo: true,
      ...overrides,
    } as any,
  })) as { id: number; scoring?: { current_month_leads?: number } };
}

describe("dispatchToDealers (integration)", () => {
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
    await db.delete(auditLog);
    await db.delete(emailLog);
    const payload = await getPayload({ config });
    await payload.delete({
      collection: "lead_assignments",
      where: { id: { greater_than: 0 } },
    });
    await payload.delete({
      collection: "lead_requests",
      where: { customer_email: { contains: "@example.com" } },
    });
    await payload.delete({
      collection: "dealers",
      where: { is_demo: { equals: true } },
    });
  });

  it("happy path: creates assignments, transitions lead, increments counters, emails", async () => {
    const lead = await createLead();
    const d1 = await createDealer();
    const d2 = await createDealer();
    const d3 = await createDealer();

    const result = await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [
        { dealerId: d1.id, qualityScoreAtDispatch: 0.42 },
        { dealerId: d2.id, qualityScoreAtDispatch: 0.31 },
        { dealerId: d3.id, qualityScoreAtDispatch: 0.28 },
      ],
      actorAdminId: "admin-1",
    });

    expect(result.ok).toBe(true);
    expect(result.assignmentsCreated).toBe(3);
    expect(result.assignmentsSkipped).toBe(0);
    expect(result.emailsDispatched).toBe(3);
    expect(result.errors).toEqual([]);

    const payload = await getPayload({ config });
    const updatedLead = await payload.findByID({ collection: "lead_requests", id: lead.id });
    expect(updatedLead.status).toBe("sent");

    const assignments = await payload.find({
      collection: "lead_assignments",
      where: { lead: { equals: lead.id } },
    });
    expect(assignments.docs).toHaveLength(3);
    for (const a of assignments.docs) {
      expect(a.status).toBe("sent");
      expect(a.sent_at).toBeTruthy();
      expect(typeof a.quality_score_at_dispatch).toBe("number");
    }

    // Counters bumped on each dealer.
    for (const id of [d1.id, d2.id, d3.id]) {
      const updated = await payload.findByID({ collection: "dealers", id });
      expect(updated.scoring?.current_month_leads).toBe(1);
    }

    const emails = await getDb().select().from(emailLog);
    expect(emails.filter((e) => e.templateName === "lead-to-dealer")).toHaveLength(3);

    const audits = await getDb().select().from(auditLog);
    const dispatchAudit = audits.find((a) => a.action === "lead.dispatch_to_dealers");
    expect(dispatchAudit).toBeDefined();
    expect(dispatchAudit?.actorId).toBe("admin-1");
  });

  it("returns no_dealers_selected when selection list is empty", async () => {
    const lead = await createLead();
    const result = await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [],
      actorAdminId: "admin-1",
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("no_dealers_selected");
  });

  it("returns lead_closed when lead is already cancelled", async () => {
    const lead = await createLead({ status: "closed" });
    const dealer = await createDealer();
    const result = await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [{ dealerId: dealer.id, qualityScoreAtDispatch: 0.5 }],
      actorAdminId: "admin-1",
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("lead_closed");
  });

  it("re-dispatch is idempotent: existing (lead, dealer) pairs are skipped", async () => {
    const lead = await createLead();
    const d1 = await createDealer();
    const d2 = await createDealer();

    await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [{ dealerId: d1.id, qualityScoreAtDispatch: 0.5 }],
      actorAdminId: "admin-1",
    });

    const second = await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [
        { dealerId: d1.id, qualityScoreAtDispatch: 0.5 }, // already assigned
        { dealerId: d2.id, qualityScoreAtDispatch: 0.4 }, // new
      ],
      actorAdminId: "admin-1",
    });

    expect(second.assignmentsCreated).toBe(1);
    expect(second.assignmentsSkipped).toBe(1);

    const payload = await getPayload({ config });
    const assignments = await payload.find({
      collection: "lead_assignments",
      where: { lead: { equals: lead.id } },
    });
    expect(assignments.docs).toHaveLength(2);

    // d1.current_month_leads should be 1 (incremented once on first dispatch),
    // not 2 (the duplicate selection on the re-dispatch was skipped).
    const dealer1Updated = await payload.findByID({ collection: "dealers", id: d1.id });
    expect(dealer1Updated.scoring?.current_month_leads).toBe(1);
  });

  it("inactive dealers are skipped with a per-dealer error", async () => {
    const lead = await createLead();
    const active = await createDealer();
    const inactive = await createDealer({ is_active: false });

    const result = await dispatchToDealers({
      leadId: lead.id,
      dealerSelections: [
        { dealerId: active.id, qualityScoreAtDispatch: 0.5 },
        { dealerId: inactive.id, qualityScoreAtDispatch: 0.4 },
      ],
      actorAdminId: "admin-1",
    });

    expect(result.assignmentsCreated).toBe(1);
    expect(result.errors.some((e) => e.includes(`dealer_${inactive.id}_inactive`))).toBe(true);
  });
});
