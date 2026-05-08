import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { logConsent } from "@/lib/consent-log";
import { logAudit } from "@/lib/audit-log";
import { logEmailQueued, markFailed, markSent } from "@/lib/email-log";
import { sendEmail } from "@/lib/email/client";
import { getDb } from "@/lib/db/client";
import { auditLog, consentLog, emailLog } from "@/lib/db/schema";
import SmokeEmail from "@/emails/_smoke";

describe("logging helpers (integration)", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.delete(consentLog);
    await db.delete(auditLog);
    await db.delete(emailLog);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logConsent inserts a row with the supplied fields", async () => {
    await logConsent({
      email: "ana@example.com",
      type: "oup",
      granted: true,
      sourceForm: "lead_request_wizard",
      ipAddress: "1.2.3.4",
      userAgent: "Mozilla/5.0 test",
    });

    const rows = await getDb().select().from(consentLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      customerEmail: "ana@example.com",
      consentType: "oup",
      granted: true,
      sourceForm: "lead_request_wizard",
      ipAddress: "1.2.3.4",
    });
  });

  it("logAudit serializes before/after as JSON and stringifies entityId", async () => {
    await logAudit({
      actorType: "admin",
      actorId: "42",
      action: "lead.send_to_dealers",
      entityType: "lead_request",
      entityId: 17,
      before: { status: "new" },
      after: { status: "sent", dealer_count: 5 },
      ipAddress: "10.0.0.1",
    });

    const rows = await getDb().select().from(auditLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorType: "admin",
      actorId: "42",
      action: "lead.send_to_dealers",
      entityType: "lead_request",
      entityId: "17",
      before: { status: "new" },
      after: { status: "sent", dealer_count: 5 },
    });
  });

  it("logAudit accepts null/undefined entityId and snapshots", async () => {
    await logAudit({ actorType: "system", action: "cron.cleanup" });
    const rows = await getDb().select().from(auditLog);
    expect(rows[0]).toMatchObject({
      actorType: "system",
      action: "cron.cleanup",
      entityType: null,
      entityId: null,
      before: null,
      after: null,
    });
  });

  it("logEmailQueued inserts pending row and returns id", async () => {
    const { id } = await logEmailQueued({
      templateName: "lead-confirmation",
      recipientEmail: "kupac@example.com",
      subject: "Tvoj upit VZ-2026-05-08-A1B2",
      payload: { display_id: "VZ-2026-05-08-A1B2" },
    });

    const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, id));
    expect(row).toMatchObject({
      templateName: "lead-confirmation",
      recipientEmail: "kupac@example.com",
      status: "pending",
      sentAt: null,
      providerMessageId: null,
      payload: { display_id: "VZ-2026-05-08-A1B2" },
    });
  });

  it("markSent updates status, providerMessageId, sentAt", async () => {
    const { id } = await logEmailQueued({
      templateName: "lead-to-dealer",
      recipientEmail: "diler@example.com",
      subject: "Novi upit",
    });
    await markSent(id, "resend-msg-abc");

    const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, id));
    expect(row.status).toBe("sent");
    expect(row.providerMessageId).toBe("resend-msg-abc");
    expect(row.sentAt).toBeInstanceOf(Date);
  });

  it("markFailed updates status + errorMessage", async () => {
    const { id } = await logEmailQueued({
      templateName: "magic-link",
      recipientEmail: "kupac@example.com",
      subject: "Tvoj tracking link",
    });
    await markFailed(id, "Resend 5xx — domain not verified");

    const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, id));
    expect(row.status).toBe("failed");
    expect(row.errorMessage).toBe("Resend 5xx — domain not verified");
  });

  it("sendEmail in dev mode (no RESEND_API_KEY) logs queued + sent with dev-mock id", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Dev smoke",
      template: SmokeEmail(),
      templateName: "lead-confirmation",
      payload: { reason: "test" },
    });
    expect(result.id).toBe("dev-mock");

    const rows = await getDb().select().from(emailLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      templateName: "lead-confirmation",
      recipientEmail: "test@example.com",
      subject: "Dev smoke",
      status: "sent",
      providerMessageId: "dev-mock",
      payload: { reason: "test" },
    });
    expect(warn).toHaveBeenCalledOnce();
  });
});
