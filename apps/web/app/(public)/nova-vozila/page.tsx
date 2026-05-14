import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BrandCard from "@/components/catalog/BrandCard";
import CategoryCard from "@/components/catalog/CategoryCard";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getAllActiveBrands, getAllBodyTypes, getTopBrandsForMegaMenu } from "@/lib/catalog/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nova vozila",
  description:
    "Istraži marke, modele i kategorije novih vozila. Zatraži ponudu od provjerenih partnera u nekoliko klikova.",
  alternates: { canonical: "/nova-vozila" },
};

export default async function NovaVozilaHubPage() {
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
