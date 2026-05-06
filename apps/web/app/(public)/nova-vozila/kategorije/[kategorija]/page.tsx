import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ModelsByBodyTypeFilter from "@/components/catalog/ModelsByBodyTypeFilter";
import { getAllBodyTypes, getBodyTypeBySlug, getModelsByBodyType } from "@/lib/catalog/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { kategorija: string };

export async function generateStaticParams(): Promise<Params[]> {
  const bodyTypes = await getAllBodyTypes();
  return bodyTypes.map((bt) => ({ kategorija: bt.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { kategorija } = await params;
  const bodyType = await getBodyTypeBySlug(kategorija);
  if (!bodyType) return { title: "Kategorija nije pronađena" };
  const description =
    bodyType.description ??
    `Pregled vozila kategorije ${bodyType.name} na vozilla.hr — usporedi modele i zatraži ponudu.`;
  return {
    title: `${bodyType.name} — kategorija`,
    description,
    alternates: { canonical: `/nova-vozila/kategorije/${bodyType.slug}` },
    openGraph: {
      title: `${bodyType.name} — vozilla.hr`,
      description,
      url: `/nova-vozila/kategorije/${bodyType.slug}`,
    },
  };
}

export default async function KategorijaPage({ params }: { params: Promise<Params> }) {
  const { kategorija } = await params;
  const bodyType = await getBodyTypeBySlug(kategorija);
  if (!bodyType) notFound();

  const models = await getModelsByBodyType(bodyType.id);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: "/nova-vozila" },
    { name: "Kategorije", href: "/nova-vozila/kategorije" },
    { name: bodyType.name },
  ];

  const fallbackIcon = bodyType.icon_svg_path ?? "/placeholders/vehicles/default.svg";

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface-muted py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <span className="text-text-muted text-sm uppercase tracking-wide">Kategorija</span>
              <Heading level={1} className="mt-2">
                {bodyType.name}
              </Heading>
              <p className="text-text-muted mt-3 max-w-2xl text-base">
                {bodyType.description ??
                  `Modeli iz kategorije ${bodyType.name}. Filtriraj po marki, otvori detalje i zatraži ponudu.`}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={requestQuoteHref({
                    bodyType: bodyType.slug,
                    source: "category",
                  })}
                  className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Zatraži ponudu za {bodyType.name}
                </Link>
              </div>
            </div>

            <div
              className="bg-surface border-surface-border text-text-muted flex aspect-[5/3] items-center justify-center rounded-md border p-6"
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
          <Heading level={2}>Modeli u kategoriji</Heading>
          <p className="text-text-muted mt-2 text-sm">
            {models.length === 0
              ? "Trenutno nema aktivnih modela u ovoj kategoriji."
              : `${models.length} aktivni model${models.length === 1 ? "" : "a"}.`}
          </p>
          <div className="mt-8">
            <ModelsByBodyTypeFilter models={models} filterBy="brand" />
          </div>
        </Container>
      </section>
    </>
  );
}
