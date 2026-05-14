import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/lib/email/dispatch";

// Subject lines are HR copy and a small but visible regression surface
// (admin sees them in their inbox). renderTemplate is pure so we can
// exercise every branch without DB or Resend.

describe("renderTemplate subject construction", () => {
  it("lead-confirmation includes display id", () => {
    const { subject } = renderTemplate({
      key: "lead-confirmation",
      to: "x@y.hr",
      props: {
        customerName: "Ana",
        displayId: "VZ-2026-05-14-A1B2",
        trackerUrl: "https://vozilla.hr/upit/x",
        preferredContactMethod: "phone",
      },
    });
    expect(subject).toBe("Zaprimili smo tvoj upit VZ-2026-05-14-A1B2");
  });

  it("lead-to-dealer joins brand + model and falls back to 'novo vozilo' when both missing", () => {
    const full = renderTemplate({
      key: "lead-to-dealer",
      to: "d@x.hr",
      props: {
        dealerName: "X",
        displayId: "VZ-1",
        brand: "Audi",
        model: "A4",
        customerName: "Ana",
        customerEmailMasked: "a***@y.hr",
        customerPhoneMasked: "+385••••",
        adminUrl: "https://vozilla.hr/dileri/lead/1",
        competitorCount: 3,
      },
    } as never);
    expect(full.subject).toBe("Novi upit od kupca — Audi A4 — VZ-1");

    const noVehicle = renderTemplate({
      key: "lead-to-dealer",
      to: "d@x.hr",
      props: {
        dealerName: "X",
        displayId: "VZ-2",
        brand: null,
        model: null,
        customerName: "Ana",
        customerEmailMasked: "a***@y.hr",
        customerPhoneMasked: "+385••••",
        adminUrl: "https://vozilla.hr/dileri/lead/2",
        competitorCount: 1,
      },
    } as never);
    expect(noVehicle.subject).toBe("Novi upit od kupca — novo vozilo — VZ-2");
  });

  it("magic-link passes the caller-supplied subject through unchanged", () => {
    const { subject } = renderTemplate({
      key: "magic-link",
      to: "x@y.hr",
      props: {
        recipientName: "Ana",
        subject: "Reset lozinke",
        heading: "Reset",
        explanation: "klikni",
        url: "https://vozilla.hr/r/x",
        ttlHours: 1,
      },
    });
    expect(subject).toBe("Reset lozinke");
  });

  it("gdpr-request-resolved switches subject based on resolution", () => {
    const resolved = renderTemplate({
      key: "gdpr-request-resolved",
      to: "x@y.hr",
      props: {
        customerName: "Ana",
        displayId: "GDPR-1",
        requestType: "erasure",
        resolution: "resolved",
        resolutionDays: 30,
      } as never,
    });
    expect(resolved.subject).toBe("Tvoj GDPR zahtjev (GDPR-1) je riješen");

    const rejected = renderTemplate({
      key: "gdpr-request-resolved",
      to: "x@y.hr",
      props: {
        customerName: "Ana",
        displayId: "GDPR-1",
        requestType: "erasure",
        resolution: "rejected",
        resolutionDays: 30,
      } as never,
    });
    expect(rejected.subject).toBe("Tvoj GDPR zahtjev (GDPR-1) je odbijen");
  });

  it("admin-new-lead-notification appends (review) when flagReview=true", () => {
    const flagged = renderTemplate({
      key: "admin-new-lead-notification",
      to: "admin@vozilla.hr",
      props: {
        displayId: "VZ-1",
        customerName: "Ana",
        brand: null,
        model: null,
        recaptchaScore: 0.1,
        source: "header",
        adminUrl: "https://vozilla.hr/admin/lead-dispatch/1",
        flagReview: true,
      },
    });
    expect(flagged.subject).toBe("[admin] Novi upit VZ-1 (review)");
  });

  it("dealer-reminder-2 rounds expiresInHours into the subject", () => {
    const { subject } = renderTemplate({
      key: "dealer-reminder-2",
      to: "d@x.hr",
      props: {
        dealerName: "X",
        displayId: "VZ-1",
        brand: "Audi",
        model: "A4",
        customerName: "Ana",
        adminUrl: "https://vozilla.hr/dileri/lead/1",
        hoursSinceSent: 48,
        expiresInHours: 23.6,
        competitorCount: 2,
      } as never,
    });
    expect(subject).toBe("Drugi podsjetnik: VZ-1 ističe za 24h");
  });
});
