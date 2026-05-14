// Wizard-side state shape. Loosely typed (every field optional except
// honeypot+booleans) since the user fills it gradually. validateStep()
// + draftToApiBody() are the gates that turn it into a valid POST body.

export type CtaSource =
  | "header"
  | "hub"
  | "brand"
  | "category"
  | "detail"
  | "recenzija"
  | "usporedba"
  | "quiz"
  | "leasing"
  | "sticky"
  | "oglas"
  | "other";

export type RequestType = "new" | "used" | "leasing" | "unsure";
export type FinancingType = "cash" | "bank_loan" | "leasing" | "undecided";
export type LeasingType = "operating" | "financial";
export type TimeFrame = "immediate" | "1m" | "3m" | "6m" | "later";
export type ContactMethod = "phone" | "email" | "whatsapp" | "any";

export type LeadDraft = {
  // Step 1 — Vehicle
  request_type?: RequestType;
  brand_id?: number;
  model_id?: number;
  version_text?: string;
  comments?: string;

  // Step 2 — Budget + financing
  price_min?: number;
  price_max?: number;
  financing_type?: FinancingType;
  leasing_type?: LeasingType;
  deposit?: number;
  period_months?: number;
  has_trade_in: boolean;
  trade_in_brand?: string;
  trade_in_model?: string;
  trade_in_year?: number;
  trade_in_mileage_km?: number;
  trade_in_condition?: "excellent" | "good" | "fair" | "poor";
  time_frame?: TimeFrame;

  // Step 3 — Contact
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_county_id?: number;
  customer_postcode?: string;
  preferred_contact_method?: ContactMethod;
  best_contact_time?: string;

  // Step 4 — Consent
  gdpr_consent: boolean;
  marketing_consent: boolean;

  // Hidden / meta
  source: CtaSource;
  /** Honeypot — must stay empty. */
  _hp_email: string;
};

export const EMPTY_DRAFT: LeadDraft = {
  has_trade_in: false,
  gdpr_consent: false,
  marketing_consent: false,
  source: "other",
  _hp_email: "",
};

export type StepIndex = 0 | 1 | 2 | 3;

export type StepErrors = Partial<Record<keyof LeadDraft, string>>;

export function validateStep(step: StepIndex, draft: LeadDraft): StepErrors {
  const errors: StepErrors = {};

  if (step === 0) {
    if (!draft.request_type) errors.request_type = "Odaberi tip upita.";
    // brand/model not strictly required (header CTA may have neither) —
    // but we encourage filling at least one with a soft warning UX, not
    // a hard validation block.
  }

  if (step === 1) {
    if (
      draft.price_min !== undefined &&
      draft.price_max !== undefined &&
      draft.price_min > draft.price_max
    ) {
      errors.price_min = "Min. cijena ne može biti veća od max.";
    }
    if (draft.financing_type === "leasing" && !draft.leasing_type) {
      errors.leasing_type = "Odaberi vrstu leasinga.";
    }
    if (!draft.time_frame) errors.time_frame = "Odaberi vremenski okvir.";
    if (draft.has_trade_in && !draft.trade_in_brand?.trim()) {
      errors.trade_in_brand = "Marka vozila za zamjenu je obavezna.";
    }
  }

  if (step === 2) {
    if (!draft.customer_name?.trim() || draft.customer_name.trim().length < 2) {
      errors.customer_name = "Ime i prezime, najmanje 2 znaka.";
    }
    if (!draft.customer_email?.trim()) {
      errors.customer_email = "Email je obavezan.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customer_email)) {
      errors.customer_email = "Neispravan format emaila.";
    }
    if (!draft.customer_phone?.trim()) {
      errors.customer_phone = "Telefon je obavezan.";
    }
    if (!draft.customer_county_id) {
      errors.customer_county_id = "Odaberi županiju.";
    }
    if (!draft.customer_postcode || !/^\d{5}$/.test(draft.customer_postcode)) {
      errors.customer_postcode = "Poštanski broj mora imati 5 znamenki.";
    }
    if (!draft.preferred_contact_method) {
      errors.preferred_contact_method = "Odaberi preferirani kontakt.";
    }
  }

  if (step === 3) {
    if (!draft.gdpr_consent) {
      errors.gdpr_consent = "Privola na obradu podataka je obavezna.";
    }
  }

  return errors;
}

/**
 * Maps the wizard draft to the POST /api/leads body. recaptcha_token is
 * passed in separately because it's resolved async at submit time.
 */
export function draftToApiBody(draft: LeadDraft, recaptchaToken: string): Record<string, unknown> {
  return {
    request_type: draft.request_type,
    brand_id: draft.brand_id ?? undefined,
    model_id: draft.model_id ?? undefined,
    version_text: draft.version_text || undefined,
    comments: draft.comments || undefined,
    price_min: draft.price_min,
    price_max: draft.price_max,
    financing_type: draft.financing_type,
    leasing_type: draft.financing_type === "leasing" ? draft.leasing_type : undefined,
    deposit: draft.deposit,
    period_months: draft.period_months,
    has_trade_in: draft.has_trade_in,
    trade_in_data: draft.has_trade_in
      ? {
          brand: draft.trade_in_brand || undefined,
          model: draft.trade_in_model || undefined,
          year: draft.trade_in_year,
          mileage_km: draft.trade_in_mileage_km,
          condition: draft.trade_in_condition,
        }
      : undefined,
    time_frame: draft.time_frame,
    customer_name: draft.customer_name?.trim(),
    customer_email: draft.customer_email?.trim(),
    customer_phone: draft.customer_phone?.trim(),
    customer_county_id: draft.customer_county_id,
    customer_postcode: draft.customer_postcode?.trim(),
    preferred_contact_method: draft.preferred_contact_method,
    best_contact_time: draft.best_contact_time || undefined,
    gdpr_consent: draft.gdpr_consent,
    marketing_consent: draft.marketing_consent,
    source: draft.source,
    recaptcha_token: recaptchaToken,
    recaptcha_action: "lead_create",
    _hp_email: draft._hp_email,
  };
}
