import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import FilterSidebar from "@/components/used-cars/FilterSidebar";
import ListingCard from "@/components/used-cars/ListingCard";
import Pagination from "@/components/used-cars/Pagination";
import SortDropdown from "@/components/used-cars/SortDropdown";
import { fetchUsedCarListings } from "@/lib/used-cars/fetch";
import { isFilterEmpty, parseFilter } from "@/lib/used-cars/filter";
import {
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
  getBodyTypeOptions,
  getBrandOptions,
  getCountyOptions,
} from "@/lib/used-cars/options";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

// Listings page is dynamic — every filter combination is a fresh URL and
// the underlying data changes whenever a dealer creates / updates a
// listing. We cache at the fetcher layer with revalidateTag rather than
// at the page layer.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rabljena vozila",
  description:
    "Pretraži rabljena vozila iz cijele Hrvatske — filtriraj po marki, kategoriji, cijeni, godini i kilometraži.",
  alternates: { canonical: "/rabljena-vozila" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Rabljena vozila" }];

export default async function RabljenaVozilaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params);

  // Load the listings + sidebar option lists in parallel — they're
  // independent reads and the page can't render without them all.
  const [result, brands, bodyTypes, counties] = await Promise.all([
    fetchUsedCarListings(filter),
    getBrandOptions(),
    getBodyTypeOptions(),
    getCountyOptions(),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Rabljena vozila</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Pretraži oglase rabljenih vozila iz cijele Hrvatske. Filtriraj po marki, kategoriji,
            cijeni, godini, kilometraži i županiji.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <FilterSidebar
              filter={filter}
              brands={brands}
              bodyTypes={bodyTypes}
              fuels={FUEL_OPTIONS}
              transmissions={TRANSMISSION_OPTIONS}
              counties={counties}
            />

            <div>
              <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-text-muted text-sm" aria-live="polite">
                  {result.total === 0
                    ? "Nema rezultata."
                    : result.total === 1
                      ? "1 oglas"
                      : `${result.total} oglasa`}
                </p>
                <SortDropdown filter={filter} />
              </div>

              {result.total === 0 ? (
                <EmptyState filterActive={!isFilterEmpty(filter)} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {result.listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                  <Pagination filter={filter} totalPages={result.totalPages} />
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function EmptyState({ filterActive }: { filterActive: boolean }) {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-8 text-center">
      <Heading level={2} className="text-lg">
        Nema oglasa koji odgovaraju filteru
      </Heading>
      <p className="text-text-muted mt-2 text-sm">
        {filterActive
          ? "Pokušaj proširiti raspon cijene ili godine, ili obriši neki od filtera."
          : "Katalog rabljenih vozila se trenutno popunjava. Vrati se uskoro."}
      </p>
      {filterActive ? (
        <Link
          href="/rabljena-vozila"
          className="bg-brand-accent text-brand-primary mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          Resetiraj filter
        </Link>
      ) : null}
    </div>
  );
}
