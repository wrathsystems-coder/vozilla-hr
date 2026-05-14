import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import LeadWizard from "@/components/forms/LeadWizard";
import { EMPTY_DRAFT, type CtaSource, type LeadDraft } from "@/components/forms/LeadWizard/types";
import { getAllActiveBrands, getAllActiveModels, getBrandBySlug } from "@/lib/catalog/fetch";
import { getDb } from "@/lib/db/client";
import { counties } from "@/lib/db/schema";

// Force dynamic so query params are evaluated per request — wizard pre-fill
// (?marka=audi&model=a4&izvor=detail) must reflect the URL the user clicked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zatraži ponudu",
  description:
    "Pošalji upit i odabrani dileri direktno te kontaktiraju s ponudom u nekoliko koraka.",
  robots: { index: true, follow: true },
};

const VALID_SOURCES: ReadonlySet<CtaSource> = new Set([
  "header",
  "hub",
  "brand",
  "category",
  "detail",
  "recenzija",
  "usporedba",
  "quiz",
  "leasing",
  "sticky",
  "oglas",
  "other",
]);

type SearchParams = {
  marka?: string;
  model?: string;
  izvor?: string;
};

async function loadCounties() {
  const rows = await getDb()
    .select({ id: counties.id, name: counties.name, sortOrder: counties.sortOrder })
    .from(counties)
    .orderBy(counties.sortOrder);
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export default async function ZatraziPonuduPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [brands, models, countyList] = await Promise.all([
    getAllActiveBrands(),
    getAllActiveModels(),
    loadCounties(),
  ]);

  // Resolve ?marka=audi → brand.id, ?model=a4 → model.id (within brand).
  let brandId: number | undefined;
  let modelId: number | undefined;
  if (params.marka) {
    const brand = await getBrandBySlug(params.marka);
    if (brand) {
      brandId = brand.id;
      if (params.model) {
        const matched = models.find(
          (m) =>
            m.slug === params.model &&
            (typeof m.brand === "number" ? m.brand : m.brand?.id) === brand.id,
        );
        modelId = matched?.id;
      }
    }
  }

  const sourceCandidate = (params.izvor ?? "other") as CtaSource;
  const source: CtaSource = VALID_SOURCES.has(sourceCandidate) ? sourceCandidate : "other";

  const initialDraft: LeadDraft = {
    ...EMPTY_DRAFT,
    brand_id: brandId,
    model_id: modelId,
    source,
  };

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <Heading level={1}>Zatraži ponudu</Heading>
        <p className="text-text-muted mt-3 text-base">
          Popuni 4 koraka i naš tim šalje upit prema 3-5 odabranih dilera. Direktno te kontaktiraju
          s ponudom.
        </p>
        <div className="mt-10">
          <LeadWizard
            brands={brands}
            models={models}
            counties={countyList}
            initialDraft={initialDraft}
          />
        </div>
      </div>
    </Container>
  );
}
