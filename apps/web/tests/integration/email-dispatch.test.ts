import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import { dispatch } from "@/lib/email/dispatch";
import { getDb } from "@/lib/db/client";
import { emailLog } from "@/lib/db/schema";
import LeadConfirmation from "@/emails/lead-confirmation";
import LeadToDealer from "@/emails/lead-to-dealer";
import MagicLink from "@/emails/magic-link";
import GdprRequestReceived from "@/emails/gdpr-request-received";
import GdprRequestResolved from "@/emails/gdpr-request-resolved";
import AdminNewLeadNotification from "@/emails/admin-new-lead-notification";

describe("email dispatch + templates (integration)", () => {
  beforeEach(async () => {
    await getDb().delete(emailLog);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("template rendering smoke tests", () => {
    it("LeadConfirmation renders without throwing", async () => {
      const html = await render(
        LeadConfirmation({
          customerName: "Ana Anić",
          displayId: "VZ-2026-05-08-A1B2",
          trackerUrl: "https://vozilla.hr/upit/abc123",
          preferredContactMethod: "phone",
        }),
      );
      expect(html).toContain("VZ-2026-05-08-A1B2");
      expect(html).toContain("Ana Anić");
      expect(html).toContain("https://vozilla.hr/upit/abc123");
    });

    it("LeadToDealer renders dealer + customer + vehicle blocks", async () => {
      const html = await render(
        LeadToDealer({
          dealerName: "Auto Salon Zagreb",
          displayId: "VZ-2026-05-08-A1B2",
          brand: "Audi",
          model: "A4",
          versionText: "2.0 TDI",
          priceMin: 35000,
          priceMax: 45000,
          financingType: "leasing",
          hasTradeIn: true,
          timeFrame: "1m",
          customerName: "Ana Anić",
          customerPhone: "+385911234567",
          customerEmail: "ana@example.com",
          customerCounty: "Grad Zagreb",
          customerPostcode: "10000",
          preferredContactMethod: "phone",
          bestContactTime: "9-17h",
          competitorCount: 4,
          dashboardUrl: "https://vozilla.hr/partneri/lead/17",
          responseDeadlineHours: 48,
        }),
      );
      expect(html).toContain("Audi A4");
      expect(html).toContain("Ana Anić");
      expect(html).toContain("+385911234567");
      expect(html).toContain("još 4 dilerima");
      expect(html).toContain("48 sati");
    });

    it("MagicLink renders heading and url", async () => {
      const html = await render(
        MagicLink({
          recipientName: "Ana",
          subject: "Tvoj tracking link",
          heading: "Tvoj tracking link",
          explanation: "Klikni za otvaranje statusa upita.",
          url: "https://vozilla.hr/upit/abc",
          ttlHours: 720,
        }),
      );
      expect(html).toContain("Tvoj tracking link");
      expect(html).toContain("https://vozilla.hr/upit/abc");
      expect(html).toContain("720");
    });

    it("GdprRequestReceived renders type label and resolution deadline", async () => {
      const html = await render(
        GdprRequestReceived({
          customerName: "Marko",
          displayId: "GDPR-2026-0001",
          requestType: "erasure",
          resolutionDays: 30,
        }),
      );
      expect(html).toContain("GDPR-2026-0001");
      expect(html).toContain("brisanja");
      expect(html).toContain("30 dana");
    });

    it("GdprRequestResolved renders different headings for resolved/rejected", async () => {
      const resolvedHtml = await render(
        GdprRequestResolved({
          customerName: "Marko",
          displayId: "GDPR-2026-0001",
          requestType: "access",
          resolution: "resolved",
        }),
      );
      expect(resolvedHtml).toContain("riješen");

      const rejectedHtml = await render(
        GdprRequestResolved({
          customerName: "Marko",
          displayId: "GDPR-2026-0001",
          requestType: "access",
          resolution: "rejected",
          adminNotes: "Identitet nismo mogli potvrditi.",
        }),
      );
      expect(rejectedHtml).toContain("odbijen");
      expect(rejectedHtml).toContain("Identitet nismo mogli potvrditi.");
    });

    it("AdminNewLeadNotification surfaces review flag", async () => {
      const html = await render(
        AdminNewLeadNotification({
          displayId: "VZ-2026-05-08-A1B2",
          customerName: "Ana",
          brand: "Audi",
          model: "A4",
          recaptchaScore: 0.4,
          source: "detail",
          adminUrl: "https://vozilla.hr/admin/lead-dispatch/17",
          flagReview: true,
        }),
      );
      expect(html).toContain("review");
      expect(html).toContain("0.40");
    });
  });

  describe("dispatch", () => {
    beforeEach(() => {
      // Force dev-mock path so we don't try to call Resend in CI.
      vi.stubEnv("RESEND_API_KEY", "");
    });

    it("dispatches lead-confirmation with the right subject + template name", async () => {
      const result = await dispatch({
        key: "lead-confirmation",
        to: "ana@example.com",
        props: {
          customerName: "Ana",
          displayId: "VZ-2026-05-08-X1Y2",
          trackerUrl: "https://vozilla.hr/upit/abc",
          preferredContactMethod: "email",
        },
      });
      expect(result.id).toBe("dev-mock");

      const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, result.logId));
      expect(row.templateName).toBe("lead-confirmation");
      expect(row.subject).toBe("Zaprimili smo tvoj upit VZ-2026-05-08-X1Y2");
      expect(row.recipientEmail).toBe("ana@example.com");
      expect(row.status).toBe("sent");
    });

    it("dispatches lead-to-dealer with vehicle in subject", async () => {
      const result = await dispatch({
        key: "lead-to-dealer",
        to: "diler@example.com",
        props: {
          dealerName: "Auto Salon",
          displayId: "VZ-1",
          brand: "Audi",
          model: "A4",
          hasTradeIn: false,
          customerName: "Ana",
          customerPhone: "+385911234567",
          customerEmail: "ana@example.com",
          customerPostcode: "10000",
          preferredContactMethod: "phone",
          competitorCount: 4,
          dashboardUrl: "https://vozilla.hr/partneri/lead/1",
          responseDeadlineHours: 48,
        },
      });
      const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, result.logId));
      expect(row.subject).toContain("Audi A4");
      expect(row.subject).toContain("VZ-1");
    });

    it("admin notification subject flags review", async () => {
      const result = await dispatch({
        key: "admin-new-lead-notification",
        to: "admin@example.com",
        props: {
          displayId: "VZ-2",
          customerName: "Ana",
          recaptchaScore: 0.3,
          source: "header",
          adminUrl: "https://vozilla.hr/admin/lead-dispatch/2",
          flagReview: true,
        },
      });
      const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, result.logId));
      expect(row.subject).toBe("[admin] Novi upit VZ-2 (review)");
    });

    it("magic-link uses caller-supplied subject", async () => {
      const result = await dispatch({
        key: "magic-link",
        to: "ana@example.com",
        props: {
          recipientName: "Ana",
          subject: "Resetiraj svoju lozinku",
          heading: "Resetiraj lozinku",
          explanation: "Klikni za postavljanje nove lozinke.",
          url: "https://vozilla.hr/partneri/zaboravljena-lozinka/abc",
          ttlHours: 1,
        },
      });
      const [row] = await getDb().select().from(emailLog).where(eq(emailLog.id, result.logId));
      expect(row.subject).toBe("Resetiraj svoju lozinku");
    });
  });
});
