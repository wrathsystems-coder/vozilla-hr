import { describe, expect, it } from "vitest";
import {
  draftToApiBody,
  EMPTY_DRAFT,
  validateStep,
  type LeadDraft,
} from "@/components/forms/LeadWizard/types";

function makeDraft(overrides: Partial<LeadDraft> = {}): LeadDraft {
  return { ...EMPTY_DRAFT, ...overrides };
}

describe("validateStep", () => {
  it("step 0 requires request_type", () => {
    expect(validateStep(0, makeDraft())).toEqual({ request_type: expect.any(String) });
    expect(validateStep(0, makeDraft({ request_type: "new" }))).toEqual({});
  });

  it("step 1 requires time_frame and rejects price_min > price_max", () => {
    const errs = validateStep(1, makeDraft());
    expect(errs.time_frame).toBeDefined();

    const priceErr = validateStep(
      1,
      makeDraft({ price_min: 50000, price_max: 10000, time_frame: "1m" }),
    );
    expect(priceErr.price_min).toBeDefined();

    const ok = validateStep(1, makeDraft({ price_min: 10000, price_max: 50000, time_frame: "1m" }));
    expect(ok).toEqual({});
  });

  it("step 1 requires leasing_type when financing_type=leasing", () => {
    const missing = validateStep(1, makeDraft({ financing_type: "leasing", time_frame: "1m" }));
    expect(missing.leasing_type).toBeDefined();

    const ok = validateStep(
      1,
      makeDraft({
        financing_type: "leasing",
        leasing_type: "operating",
        time_frame: "1m",
      }),
    );
    expect(ok).toEqual({});
  });

  it("step 1 requires trade_in_brand when has_trade_in=true", () => {
    const missing = validateStep(1, makeDraft({ has_trade_in: true, time_frame: "1m" }));
    expect(missing.trade_in_brand).toBeDefined();
  });

  it("step 2 enforces all customer fields", () => {
    const errs = validateStep(2, makeDraft());
    expect(errs.customer_name).toBeDefined();
    expect(errs.customer_email).toBeDefined();
    expect(errs.customer_phone).toBeDefined();
    expect(errs.customer_county_id).toBeDefined();
    expect(errs.customer_postcode).toBeDefined();
    expect(errs.preferred_contact_method).toBeDefined();
  });

  it("step 2 rejects malformed email and short postcode", () => {
    const errs = validateStep(
      2,
      makeDraft({
        customer_name: "Ana Anić",
        customer_email: "not-an-email",
        customer_phone: "0911234567",
        customer_county_id: 21,
        customer_postcode: "123",
        preferred_contact_method: "phone",
      }),
    );
    expect(errs.customer_email).toMatch(/format/i);
    expect(errs.customer_postcode).toBeDefined();
  });

  it("step 2 passes with all valid fields", () => {
    const errs = validateStep(
      2,
      makeDraft({
        customer_name: "Ana Anić",
        customer_email: "ana@example.com",
        customer_phone: "0911234567",
        customer_county_id: 21,
        customer_postcode: "10000",
        preferred_contact_method: "phone",
      }),
    );
    expect(errs).toEqual({});
  });

  it("step 3 requires gdpr_consent=true", () => {
    expect(validateStep(3, makeDraft()).gdpr_consent).toBeDefined();
    expect(validateStep(3, makeDraft({ gdpr_consent: true }))).toEqual({});
  });
});

describe("draftToApiBody", () => {
  it("maps wizard draft to POST body shape", () => {
    const draft = makeDraft({
      request_type: "new",
      brand_id: 1,
      model_id: 5,
      version_text: "  2.0 TDI  ",
      price_min: 30000,
      price_max: 40000,
      financing_type: "leasing",
      leasing_type: "operating",
      time_frame: "1m",
      customer_name: "  Ana Anić  ",
      customer_email: "  ana@example.com  ",
      customer_phone: "0911234567",
      customer_county_id: 21,
      customer_postcode: " 10000 ",
      preferred_contact_method: "phone",
      gdpr_consent: true,
      marketing_consent: true,
      source: "detail",
    });
    const body = draftToApiBody(draft, "captcha-token");
    expect(body.recaptcha_token).toBe("captcha-token");
    expect(body.recaptcha_action).toBe("lead_create");
    expect(body.brand_id).toBe(1);
    expect(body.model_id).toBe(5);
    expect(body.version_text).toBe("  2.0 TDI  "); // intentionally NOT trimmed (free text)
    expect(body.customer_name).toBe("Ana Anić");
    expect(body.customer_email).toBe("ana@example.com");
    expect(body.customer_postcode).toBe("10000");
    expect(body.leasing_type).toBe("operating");
  });

  it("strips leasing_type when financing_type is not leasing", () => {
    const draft = makeDraft({
      financing_type: "cash",
      leasing_type: "operating", // stale field
      gdpr_consent: true,
    });
    const body = draftToApiBody(draft, "t");
    expect(body.leasing_type).toBeUndefined();
  });

  it("includes trade_in_data only when has_trade_in is true", () => {
    const noTradeIn = draftToApiBody(makeDraft({ has_trade_in: false }), "t");
    expect(noTradeIn.trade_in_data).toBeUndefined();

    const withTradeIn = draftToApiBody(
      makeDraft({
        has_trade_in: true,
        trade_in_brand: "VW",
        trade_in_model: "Golf",
        trade_in_year: 2018,
        trade_in_mileage_km: 80000,
        trade_in_condition: "good",
      }),
      "t",
    );
    expect(withTradeIn.trade_in_data).toEqual({
      brand: "VW",
      model: "Golf",
      year: 2018,
      mileage_km: 80000,
      condition: "good",
    });
  });

  it("forwards _hp_email so server can verify the honeypot", () => {
    const body = draftToApiBody(makeDraft({ _hp_email: "" }), "t");
    expect(body._hp_email).toBe("");
  });
});
