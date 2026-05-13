import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ComparisonTable from "@/components/usporedi/ComparisonTable";
import { fetchModelsForCompare, listPublishedComparisons } from "@/lib/comparisons/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usporedi modele",
  description:
    "Usporedi do tri modela rame uz rame — cijena, segment, karoserija, pogon, mjenjač. Pre-generirane usporedbe za najpopularnije parove na vozilla.hr.",
  alternates: { canonical: "/usporedi" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Usporedi modele" }];

const MAX_COLUMNS = 3;

function parseIds(raw: string | string[] | undefined): number[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(",");
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const v of list) {
    const n = Number.parseInt(String(v).trim(), 10);
    if (Number.isFinite(n) && n > 0 && !seen.has(n)) {
      seen.add(n);
      ids.push(n);
      if (ids.length === MAX_COLUMNS) break;
    }
  }
  return ids;
}

function removeHrefForIndex(allIds: number[], idx: number): string {
  const remaining = allIds.filter((_, i) => i !== idx);
  if (remaining.length === 0) return "/usporedi";
  return `/usporedi?modeli=${remaining.join(",")}`;
}

export default async function UsporediPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ids = parseIds(params.modeli);

  // When no ids passed, surface the pre-generated comparison pairs as
  // a starting point — those are the editorial featured-pairs from
  // ComparisonPairs (commit 10 renders them as standalone /usporedi/
  // [slug] routes).
  if (ids.length === 0) {
    const featured = await listPublishedComparisons();
    return (
      <>
        <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
        <section className="bg-surface py-12">
          <Container>
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Heading level={1}>Usporedi modele</Heading>
            <p className="text-text-muted mt-3 max-w-2xl text-base">
              Odaberi do tri modela koje želiš usporediti. Sustav će prikazati cijenu, karoseriju,
              segment, pogon i mjenjač rame uz rame.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/nova-vozila/marke"
                className="bg-brand-accent text-brand-primary inline-block rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Odaberi prvi model
              </Link>
            </div>
          </Container>
        </section>

        {featured.length > 0 ? (
          <section className="bg-surface-muted py-12">
            <Container>
              <Heading level={2} className="text-xl">
                Popularne usporedbe
              </Heading>
              <p className="text-text-muted mt-2 text-sm">
                Pre-generirane usporedbe koje uređivačka redakcija drži ažurnima.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((c) => (
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

  const models = await fetchModelsForCompare(ids);
  // Drop nulls (id resolved to no active model) but preserve order.
  const present = models.filter((m): m is NonNullable<typeof m> => m !== null);
  // Keep the URL-derived id order for removeHref calculations.
  const presentIds = ids.filter((id) => models.find((m) => m?.id === id));

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Usporedi modele</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-sm">
            {present.length === 0
              ? "Modeli u URL-u nisu pronađeni — možda su deaktivirani. Pokušaj ponovno s drugim odabirom."
              : `${present.length} ${present.length === 1 ? "model" : "modela"} u usporedbi`}
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <ComparisonTable
            columns={present}
            removeHrefForIndex={(i) => removeHrefForIndex(presentIds, i)}
          />
          <p className="text-text-muted mt-6 text-xs">
            Cijene su početne — konfiguracija mijenja krajnji iznos. Pošalji upit za stvarnu ponudu
            specifičnu za tvoju konfiguraciju.
          </p>
        </Container>
      </section>
    </>
  );
}
