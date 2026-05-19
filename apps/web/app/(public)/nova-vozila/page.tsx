import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BrandCard from "@/components/catalog/BrandCard";
import CategoryCard from "@/components/catalog/CategoryCard";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getAllActiveBrands, getAllBodyTypes, getTopBrandsForMegaMenu } from "@/lib/catalog/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import { parseFilter, hasAnyFilter } from "@/lib/catalog/filter";
import { fetchModelVersionsList } from "@/lib/catalog/filter-fetch";
import { fetchFacets } from "@/lib/catalog/facets";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ActiveFilterChips from "@/components/catalog/ActiveFilterChips";
import ModelVersionListingCard from "@/components/catalog/ModelVersionListingCard";
import CatalogSortBar from "@/components/catalog/CatalogSortBar";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

const LISTING_PATH = "/nova-vozila";

// Filtered URLs need fresh data per request — `revalidate=0` opts out
// of ISR when there's any filter param. The empty-filter hub keeps the
// 1h revalidate via the inner Payload fetchers' unstable_cache wrappers.
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  if (!hasAnyFilter(filter)) {
    return {
      title: "Nova vozila",
      description:
        "Istraži marke, modele i kategorije novih vozila. Zatraži ponudu od provjerenih partnera u nekoliko klikova.",
      alternates: { canonical: LISTING_PATH },
    };
  }
  // Filtered URL — per filter-architecture.md: noindex, follow + canonical
  // points at the filter-free landing. Stops Google indexing every combo.
  return {
    title: "Katalog novih vozila",
    description: "Filtriran pregled novih vozila prema tvojim kriterijima.",
    alternates: { canonical: LISTING_PATH },
    robots: { index: false, follow: true },
  };
}

export default async function NovaVozilaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = parseFilter(sp);

  if (!hasAnyFilter(filter)) {
    return <NovaVozilaHub />;
  }

  const [listResult, facets] = await Promise.all([
    fetchModelVersionsList(filter),
    fetchFacets(filter),
  ]);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: LISTING_PATH },
    { name: "Pretraga" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface-muted py-8">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-4" />
          <Heading level={1}>Katalog vozila</Heading>
        </Container>
      </section>

      <section className="bg-surface py-8">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-4 lg:self-start">
              <FilterSidebar filter={filter} facets={facets} action={LISTING_PATH} />
            </aside>

            <div className="space-y-4">
              <ActiveFilterChips filter={filter} action={LISTING_PATH} />
              <CatalogSortBar filter={filter} total={listResult.total} action={LISTING_PATH} />

              {listResult.items.length === 0 ? (
                <div className="bg-surface-muted text-text-muted rounded-lg p-8 text-center">
                  <p className="text-text text-base font-semibold">Nema rezultata</p>
                  <p className="mt-2 text-sm">
                    Nijedno vozilo ne odgovara odabranim filterima. Pokušaj ukloniti neki filter ili
                    proširi raspone.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listResult.items.map((item) => (
                    <li key={item.id}>
                      <ModelVersionListingCard item={item} />
                    </li>
                  ))}
                </ul>
              )}

              <CatalogPagination
                filter={filter}
                totalPages={listResult.totalPages}
                action={LISTING_PATH}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

async function NovaVozilaHub() {
  const [allBrands, bodyTypes, topBrands] = await Promise.all([
    getAllActiveBrands(),
    getAllBodyTypes(),
    getTopBrandsForMegaMenu(12),
  ]);

  const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Nova vozila" }];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface-muted py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1} className="max-w-3xl">
            Nova vozila u Hrvatskoj
          </Heading>
          <p className="text-text-muted mt-4 max-w-2xl text-lg">
            Pregledaj marke, modele i kategorije. Kad nađeš ono što tražiš, jednim klikom zatraži
            ponudu — naši partneri se javljaju u roku od 24 sata.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={requestQuoteHref({ source: "hub" })}
              className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Zatraži ponudu
            </Link>
            <Link
              href="/pomoc-pri-izboru"
              className="bg-surface text-text border-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md border px-6 py-3 text-base font-semibold transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Pomoć pri izboru
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-16">
        <Container>
          <div className="flex items-end justify-between">
            <Heading level={2}>Popularne marke</Heading>
            <Link
              href="/nova-vozila/marke"
              className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Vidi sve marke ({allBrands.length}) →
            </Link>
          </div>

          {topBrands.length === 0 ? (
            <p className="text-text-muted mt-8 text-sm">Katalog se trenutno popunjava.</p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {topBrands.map((brand) => (
                <li key={brand.id}>
                  <BrandCard brand={brand} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-surface-muted py-16">
        <Container>
          <div className="flex items-end justify-between">
            <Heading level={2}>Sve kategorije</Heading>
            <Link
              href="/nova-vozila/kategorije"
              className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Pregled svih →
            </Link>
          </div>

          {bodyTypes.length === 0 ? (
            <p className="text-text-muted mt-8 text-sm">Nema dostupnih kategorija.</p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {bodyTypes.map((bt) => (
                <li key={bt.id}>
                  <CategoryCard bodyType={bt} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
