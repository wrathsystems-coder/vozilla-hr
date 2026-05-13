import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { LexicalRenderer } from "@/components/lexical/render";
import ComparisonTable from "@/components/usporedi/ComparisonTable";
import {
  getComparisonBySlug,
  listComparisonsForModel,
  listPublishedComparisons,
  type ComparisonWithModels,
  type ModelWithBrand,
} from "@/lib/comparisons/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";
import { vehicleJsonLd } from "@/lib/seo/vehicle-jsonld";
import type { Brand, BodyType, Model } from "@/payload-types";

/**
 * Pre-generated comparison routes (golf-vs-octavia style). Statically
 * generated from every published ComparisonPair; dynamicParams=true so
 * a new pair added in the admin renders on first request without a
 * rebuild. ISR 1h.
 *
 * Canonical points at the slug URL (not the dynamic ?modeli= form) so
 * Google de-duplicates correctly when both forms get scraped.
 */

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const all = await listPublishedComparisons();
    return all.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const pair = await getComparisonBySlug(slug);
  if (!pair) return { title: "Usporedba" };
  return {
    title: pair.seo?.title || pair.title,
    description:
      pair.seo?.description ||
      `Detaljna usporedba — ${describePair(pair)}. Cijena, specifikacije i ključne razlike rame uz rame.`,
    alternates: { canonical: `/usporedi/${pair.slug}` },
  };
}

function describePair(pair: ComparisonWithModels): string {
  const a = `${pair.model_a.brand?.name ?? ""} ${pair.model_a.name}`.trim();
  const b = `${pair.model_b.brand?.name ?? ""} ${pair.model_b.name}`.trim();
  return `${a} vs ${b}`;
}

/** Cast helper — depth=2 on comparison_pairs populates both relationships. */
function asModelWithBrand(m: Model & { brand?: Brand }): ModelWithBrand | null {
  if (!m.brand || typeof m.brand !== "object") return null;
  return m as ModelWithBrand;
}

function hasBodyType(
  m: Model & { brand?: Brand; body_type?: number | BodyType },
): m is Model & { brand: Brand; body_type: BodyType } {
  return (
    !!m.brand && typeof m.brand === "object" && !!m.body_type && typeof m.body_type === "object"
  );
}

export default async function ComparisonSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const pair = await getComparisonBySlug(slug);
  if (!pair) notFound();

  const modelA = asModelWithBrand(pair.model_a);
  const modelB = asModelWithBrand(pair.model_b);
  if (!modelA || !modelB) notFound();

  // Cross-link rail: comparisons that share either model with this pair.
  // Two queries (one per model) — pages are statically generated so this
  // runs at build / revalidate, not per visit.
  const [aRelated, bRelated] = await Promise.all([
    listComparisonsForModel(modelA.id, 6),
    listComparisonsForModel(modelB.id, 6),
  ]);
  const relatedMap = new Map<number, ComparisonWithModels>();
  for (const c of [...aRelated, ...bRelated]) {
    if (c.id !== pair.id) relatedMap.set(c.id, c);
  }
  const related = Array.from(relatedMap.values()).slice(0, 4);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Usporedi", href: "/usporedi" },
    { name: pair.title },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
      {hasBodyType(pair.model_a) ? <JsonLd data={vehicleJsonLd(pair.model_a)} /> : null}
      {hasBodyType(pair.model_b) ? <JsonLd data={vehicleJsonLd(pair.model_b)} /> : null}

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>{pair.title}</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-sm">
            Detaljna usporedba dvaju modela — cijena, specifikacije i ključne razlike rame uz rame.
            Cijene su početne; konfiguracija mijenja krajnji iznos.
          </p>
          <p className="text-text-muted mt-3 text-xs">
            <Link
              href={`/usporedi?modeli=${modelA.id},${modelB.id}`}
              className="underline hover:no-underline"
            >
              Otvori u dinamičkoj usporedbi
            </Link>{" "}
            (možeš dodati treći model).
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <ComparisonTable columns={[modelA, modelB]} />
        </Container>
      </section>

      {pair.content ? (
        <section className="bg-surface py-10">
          <Container>
            <Heading level={2} className="text-2xl">
              Naša preporuka
            </Heading>
            <article className="mt-4 max-w-3xl">
              <LexicalRenderer content={pair.content} />
            </article>
          </Container>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="bg-surface-muted py-10">
          <Container>
            <Heading level={2} className="text-xl">
              Često se uspoređuje s...
            </Heading>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((c) => (
                <Link
                  key={c.id}
                  href={`/usporedi/${c.slug}`}
                  className="border-surface-border bg-surface hover:border-brand-accent block rounded-md border p-4 transition-colors"
                >
                  <p className="text-text font-medium">{c.title}</p>
                  <p className="text-text-muted mt-1 text-xs">
                    {c.model_a.brand?.name} {c.model_a.name} ↔ {c.model_b.brand?.name}{" "}
                    {c.model_b.name}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
