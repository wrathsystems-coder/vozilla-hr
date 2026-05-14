// Registry of lawyer-supplied legal pages. Single source of truth so the
// public route (LegalPageShell) and the print route (/print/[slug]) render
// the same content. When the lawyer's final text lands in Payload Pages,
// the placeholder strings get replaced — first by inline edits here, then
// by a Lexical-fetch path in a follow-up.

export type LegalSlug = "opci-uvjeti" | "politika-privatnosti" | "politika-kolacica";

export type LegalPageContent = {
  slug: LegalSlug;
  title: string;
  /** Placeholder body until Payload Lexical content arrives. */
  placeholder: string;
};

const REGISTRY: Record<LegalSlug, LegalPageContent> = {
  "opci-uvjeti": {
    slug: "opci-uvjeti",
    title: "Opći uvjeti",
    placeholder: "[XXX_OUP_TEKST: pravnik dostavlja]",
  },
  "politika-privatnosti": {
    slug: "politika-privatnosti",
    title: "Politika privatnosti",
    placeholder: "[XXX_PP_TEKST: pravnik dostavlja]",
  },
  "politika-kolacica": {
    slug: "politika-kolacica",
    title: "Politika kolačića",
    placeholder: "[XXX_PK_TEKST: pravnik dostavlja]",
  },
};

export function getLegalPage(slug: string): LegalPageContent | null {
  if (!Object.prototype.hasOwnProperty.call(REGISTRY, slug)) return null;
  return REGISTRY[slug as LegalSlug];
}

export function listLegalSlugs(): readonly LegalSlug[] {
  return Object.keys(REGISTRY) as LegalSlug[];
}
