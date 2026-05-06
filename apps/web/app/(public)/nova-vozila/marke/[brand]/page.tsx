import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ModelsByBodyTypeFilter from "@/components/catalog/ModelsByBodyTypeFilter";
import { getAllActiveBrands, getBrandBySlug, getModelsByBrand } from "@/lib/catalog/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;
// Allow on-demand SSG for new brands without rebuild.
export const dynamicParams = true;

type Params = { brand: string };

export async function generateStaticParams(): Promise<Params[]> {
  const brands = await getAllActiveBrands();
  return brands.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Marka nije pronađena" };
  const description = brand.description_md
    ? brand.description_md.slice(0, 160)
    : `Otkrij modele i ponude marke ${brand.name} na vozilla.hr.`;
  return {
    title: brand.name,
    description,
    alternates: { canonical: `/nova-vozila/marke/${brand.slug}` },
    openGraph: {
      title: `${brand.name} — vozilla.hr`,
      description,
      url: `/nova-vozila/marke/${brand.slug}`,
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { brand: brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const models = await getModelsByBrand(brand.id);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: "/nova-vozila" },
    { name: "Marke", href: "/nova-vozila/marke" },
    { name: brand.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface-muted py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <span className="text-text-muted text-sm uppercase tracking-wide">Marka</span>
              <Heading level={1} className="mt-2">
                {brand.name}
              </Heading>
              {(brand.country_origin || brand.founded_year) && (
                <p className="text-text-muted mt-2 text-sm">
                  {brand.country_origin}
                  {brand.country_origin && brand.founded_year ? " · " : ""}
                  {brand.founded_year ? `osnovano ${brand.founded_year}.` : ""}
                </p>
              )}
              {brand.description_md && (
                <p className="text-text mt-4 max-w-2xl whitespace-pre-line text-base">
                  {brand.description_md}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={requestQuoteHref({ brand: brand.slug, source: "brand" })}
                  className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Zatraži ponudu za {brand.name}
                </Link>
              </div>
            </div>

            <div
              className="bg-surface border-surface-border flex aspect-[5/3] items-center justify-center rounded-md border p-6"
              aria-hidden="true"
            >
              <span className="text-text text-3xl font-bold uppercase tracking-widest">
                {brand.name}
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-16">
        <Container>
          <Heading level={2}>Modeli</Heading>
          <p className="text-text-muted mt-2 text-sm">
            {models.length === 0
              ? "Trenutno nema aktivnih modela za ovu marku."
              : `${models.length} aktivni model${models.length === 1 ? "" : "a"}.`}
          </p>
          <div className="mt-8">
            <ModelsByBodyTypeFilter models={models} showBrandOnCards={false} />
          </div>
        </Container>
      </section>
    </>
  );
}
