// Build "Zatraži ponudu" pre-fill links from anywhere in the catalog.
// Spec 03-information-architecture.md "CTA strategija (hibrid)" mandates an
// `izvor` (source) param on every contextual CTA so the lead pipeline can
// attribute the lead to the originating page.

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Source values that the lead pipeline (`POST /api/leads`) recognises in
 * Sprint 4. New entries must be added here AND in the lead schema.
 */
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
  | "sticky";

export type CtaParams = {
  brand?: string;
  model?: string;
  bodyType?: string;
  source: CtaSource;
};

/**
 * Reject anything that would round-trip badly through a query string. ASCII-
 * safe lower-kebab is the slug convention (CLAUDE.md "Hrvatski specifikum").
 */
function assertSlug(value: string, label: string): void {
  if (!SLUG_RE.test(value)) {
    throw new Error(`requestQuoteHref: invalid ${label} slug "${value}"`);
  }
}

export function requestQuoteHref(params: CtaParams): string {
  const search = new URLSearchParams();

  // Use explicit `!== undefined` so an empty string is rejected by assertSlug
  // rather than silently dropped.
  if (params.brand !== undefined) {
    assertSlug(params.brand, "brand");
    search.set("marka", params.brand);
  }
  if (params.model !== undefined) {
    assertSlug(params.model, "model");
    search.set("model", params.model);
  }
  if (params.bodyType !== undefined) {
    assertSlug(params.bodyType, "bodyType");
    search.set("kategorija", params.bodyType);
  }

  search.set("izvor", params.source);

  return `/zatrazi-ponudu?${search.toString()}`;
}
