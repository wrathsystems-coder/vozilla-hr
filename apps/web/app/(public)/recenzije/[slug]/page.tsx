import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { LexicalRenderer } from "@/components/lexical/render";
import { getReviewBySlug } from "@/lib/reviews/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";
import { vehicleJsonLd } from "@/lib/seo/vehicle-jsonld";
import { requestQuoteHref } from "@/lib/catalog/cta";
import { formatDate } from "@/lib/utils/format";
import { siteUrl } from "@/lib/seo/site-url";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return { title: "Recenzija" };
  return {
    title: review.seo?.title || review.title,
    description: review.seo?.description || `Recenzija — ${review.title} na vozilla.hr.`,
    alternates: { canonical: `/recenzije/${review.slug}` },
  };
}

export default async function ReviewSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const model = review.model && typeof review.model === "object" ? review.model : null;
  const brand = model && typeof model.brand === "object" ? model.brand : null;
  const bodyType = model && typeof model.body_type === "object" ? model.body_type : null;
  const overall = review.scores?.overall ?? null;

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Recenzije", href: "/recenzije" },
    { name: review.title },
  ];

  const reviewJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    url: `${siteUrl()}/recenzije/${review.slug}`,
    ...(review.published_at ? { datePublished: review.published_at } : {}),
    ...(overall != null
      ? {
          reviewRating: {
            "@type": "Rating",
            ratingValue: overall,
            bestRating: 10,
            worstRating: 1,
          },
        }
      : {}),
    ...(brand && model
      ? {
          itemReviewed: {
            "@type": "Vehicle",
            name: `${brand.name} ${model.name}`,
            brand: { "@type": "Brand", name: brand.name },
            model: model.name,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
      <JsonLd data={reviewJsonLd} />
      {brand && model && bodyType ? (
        <JsonLd
          data={vehicleJsonLd({
            ...model,
            brand,
            body_type: bodyType,
          })}
        />
      ) : null}

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>{review.title}</Heading>
          <div className="text-text-muted mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {brand && model ? (
              <span>
                {brand.name} {model.name}
              </span>
            ) : null}
            {review.published_at ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatDate(review.published_at.slice(0, 10))}</span>
              </>
            ) : null}
            {overall != null ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-text font-semibold">{overall.toFixed(1)} / 10</span>
              </>
            ) : null}
          </div>
        </Container>
      </section>

      {review.hero_image_path ? (
        <section className="bg-surface-muted py-6">
          <Container>
            <div className="bg-surface-muted aspect-[16/9] w-full overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.hero_image_path}
                alt={review.title}
                className="h-full w-full object-cover"
              />
            </div>
          </Container>
        </section>
      ) : null}

      <section className="bg-surface py-10">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
            <article className="max-w-3xl">
              {review.content ? <LexicalRenderer content={review.content} /> : null}
            </article>

            <aside className="space-y-6">
              {review.scores ? <ScoresBlock scores={review.scores} /> : null}
              {Array.isArray(review.pros) && review.pros.length > 0 ? (
                <ProsConsBlock title="Prednosti" items={review.pros} kind="pro" />
              ) : null}
              {Array.isArray(review.cons) && review.cons.length > 0 ? (
                <ProsConsBlock title="Mane" items={review.cons} kind="con" />
              ) : null}
              {brand && model ? (
                <Link
                  href={requestQuoteHref({
                    brand: brand.slug,
                    model: model.slug,
                    source: "recenzija",
                  })}
                  className="bg-brand-accent text-brand-primary block rounded-md px-4 py-3 text-center text-sm font-semibold hover:opacity-90"
                >
                  Zatraži ponudu za {model.name}
                </Link>
              ) : null}
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}

function ScoresBlock({
  scores,
}: {
  scores: NonNullable<Awaited<ReturnType<typeof getReviewBySlug>>>["scores"];
}) {
  if (!scores) return null;
  const rows: { label: string; value: number | null | undefined }[] = [
    { label: "Dizajn", value: scores.design },
    { label: "Udobnost", value: scores.comfort },
    { label: "Vožnja", value: scores.drive },
    { label: "Potrošnja", value: scores.economy },
    { label: "Omjer cijene", value: scores.value },
  ];
  const present = rows.filter((r) => typeof r.value === "number");
  if (present.length === 0) return null;
  return (
    <div className="border-surface-border bg-surface rounded-md border p-4">
      <Heading level={2} className="text-base">
        Ocjene
      </Heading>
      <dl className="mt-3 space-y-2 text-sm">
        {present.map((r) => (
          <div key={r.label} className="flex justify-between">
            <dt className="text-text-muted">{r.label}</dt>
            <dd className="text-text font-medium">{r.value!.toFixed(1)} / 10</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProsConsBlock({
  title,
  items,
  kind,
}: {
  title: string;
  items: { text: string }[];
  kind: "pro" | "con";
}) {
  const Icon = kind === "pro" ? Check : X;
  const iconClass = kind === "pro" ? "text-green-600" : "text-red-600";
  return (
    <div className="border-surface-border bg-surface rounded-md border p-4">
      <Heading level={2} className="text-base">
        {title}
      </Heading>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
            <span className="text-text">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
