import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ModelCard from "@/components/catalog/ModelCard";
import ModelSpecsTable from "@/components/catalog/ModelSpecsTable";
import {
  getAllActiveModels,
  getModelBySlugs,
  getModelVersions,
  getRelatedModels,
  getReviewsForModel,
} from "@/lib/catalog/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";
import { vehicleJsonLd } from "@/lib/seo/vehicle-jsonld";
import { formatPrice } from "@/lib/utils/format";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { brand: string; model: string };

const FUEL_HR: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  phev: "Plug-in hibrid",
  ev: "Električni",
  lpg: "LPG",
  cng: "CNG",
};

const TRANSMISSION_HR: Record<string, string> = {
  manual: "Manualni",
  automatic: "Automatski",
  dct: "DCT",
  cvt: "CVT",
};

export async function generateStaticParams(): Promise<Params[]> {
  const models = await getAllActiveModels();
  return models.map((m) => ({ brand: m.brand.slug, model: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  const model = await getModelBySlugs(brandSlug, modelSlug);
  if (!model) return { title: "Model nije pronađen" };
  const fullName = `${model.brand.name} ${model.name}`;
  const description = model.description_md
    ? model.description_md.slice(0, 160)
    : `Specifikacije, oprema i ponude za ${fullName} na vozilla.hr.`;
  return {
    title: fullName,
    description,
    alternates: {
      canonical: `/nova-vozila/marke/${model.brand.slug}/${model.slug}`,
    },
    openGraph: {
      title: `${fullName} — vozilla.hr`,
      description,
      url: `/nova-vozila/marke/${model.brand.slug}/${model.slug}`,
    },
  };
}

export default async function ModelPage({ params }: { params: Promise<Params> }) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const model = await getModelBySlugs(brandSlug, modelSlug);
  if (!model) notFound();

  const [versions, related] = await Promise.all([
    getModelVersions(model.id),
    getRelatedModels(model, 4),
  ]);
  const reviews = await getReviewsForModel(model.id, 3);

  const fullName = `${model.brand.name} ${model.name}`;

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: "/nova-vozila" },
    { name: "Marke", href: "/nova-vozila/marke" },
    {
      name: model.brand.name,
      href: `/nova-vozila/marke/${model.brand.slug}`,
    },
    { name: model.name },
  ];

  const fallbackIcon = model.body_type.icon_svg_path ?? "/placeholders/vehicles/default.svg";

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
      <JsonLd data={vehicleJsonLd(model)} />

      <section className="bg-surface-muted py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
            <div>
              <span className="text-text-muted text-sm uppercase tracking-wide">
                {model.brand.name}
              </span>
              <Heading level={1} className="mt-2">
                {model.name}
              </Heading>
              <p className="text-text-muted mt-2 text-sm">
                {model.body_type.name}
                {model.segment && ` · Segment ${model.segment}`}
                {model.year_from && ` · od ${model.year_from}.`}
              </p>
              {typeof model.base_price_eur === "number" && (
                <p className="text-text mt-4 text-2xl font-semibold">
                  od {formatPrice(model.base_price_eur, { decimals: 0 })}
                </p>
              )}
              {model.description_md && (
                <p className="text-text mt-4 max-w-2xl whitespace-pre-line text-base">
                  {model.description_md}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={requestQuoteHref({
                    brand: model.brand.slug,
                    model: model.slug,
                    source: "detail",
                  })}
                  className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Zatraži ponudu za {fullName}
                </Link>
                <Link
                  href={`/usporedi?modeli=${model.id}`}
                  className="bg-surface text-text border-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md border px-6 py-3 text-base font-semibold transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Usporedi
                </Link>
              </div>
            </div>

            <div
              className="bg-surface border-surface-border text-text-muted flex aspect-[5/3] items-center justify-center rounded-md border p-8"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fallbackIcon}
                alt=""
                width={400}
                height={160}
                className="h-auto w-full max-w-md"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-12">
        <Container>
          <Heading level={2}>Pregled</Heading>
          <dl className="text-text mt-6 grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {model.year_from && (
              <div>
                <dt className="text-text-muted text-xs uppercase tracking-wide">Generacija</dt>
                <dd className="mt-1 text-base font-medium">
                  od {model.year_from}.{model.year_to ? ` do ${model.year_to}.` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wide">Karoserija</dt>
              <dd className="mt-1 text-base font-medium">{model.body_type.name}</dd>
            </div>
            {model.segment && (
              <div>
                <dt className="text-text-muted text-xs uppercase tracking-wide">Segment</dt>
                <dd className="mt-1 text-base font-medium">{model.segment}</dd>
              </div>
            )}
            {model.fuel_types && model.fuel_types.length > 0 && (
              <div>
                <dt className="text-text-muted text-xs uppercase tracking-wide">Pogon</dt>
                <dd className="mt-1 text-base font-medium">
                  {model.fuel_types.map((f) => FUEL_HR[f] ?? f).join(", ")}
                </dd>
              </div>
            )}
            {model.transmissions && model.transmissions.length > 0 && (
              <div>
                <dt className="text-text-muted text-xs uppercase tracking-wide">Mjenjač</dt>
                <dd className="mt-1 text-base font-medium">
                  {model.transmissions.map((t) => TRANSMISSION_HR[t] ?? t).join(", ")}
                </dd>
              </div>
            )}
            {typeof model.base_price_eur === "number" && (
              <div>
                <dt className="text-text-muted text-xs uppercase tracking-wide">Početna cijena</dt>
                <dd className="mt-1 text-base font-medium">
                  {formatPrice(model.base_price_eur, { decimals: 0 })}
                </dd>
              </div>
            )}
          </dl>
        </Container>
      </section>

      <section className="bg-surface-muted py-12">
        <Container>
          <Heading level={2}>Verzije i specifikacije</Heading>
          <div className="mt-6">
            <ModelSpecsTable versions={versions} />
          </div>
        </Container>
      </section>

      {reviews.length > 0 && (
        <section className="bg-surface py-12">
          <Container>
            <Heading level={2}>Recenzije</Heading>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id} className="border-surface-border bg-surface rounded-md border p-5">
                  <h3 className="text-text text-base font-semibold">{r.title}</h3>
                  {r.scores?.overall != null && (
                    <p className="text-text-muted mt-2 text-sm">
                      Ukupna ocjena: <strong>{r.scores.overall}/10</strong>
                    </p>
                  )}
                  <Link
                    href={`/recenzije/${r.slug}`}
                    className="text-brand-accent focus-visible:outline-brand-accent mt-3 inline-block text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Pročitaj recenziju →
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-surface-muted py-12">
          <Container>
            <Heading level={2}>Slični modeli</Heading>
            <p className="text-text-muted mt-2 text-sm">
              Drugi modeli iz iste kategorije ({model.body_type.name}).
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((m) => (
                <li key={m.id}>
                  <ModelCard model={m} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
