import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ReviewCard from "@/components/editorial/ReviewCard";
import { listReviews } from "@/lib/reviews/fetch";
import { getBodyTypeOptions } from "@/lib/used-cars/options";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

type Params = { kat: string };

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const bodyTypes = await getBodyTypeOptions();
    return bodyTypes.map((bt) => ({ kat: bt.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { kat } = await params;
  const bodyTypes = await getBodyTypeOptions();
  const bt = bodyTypes.find((b) => b.slug === kat);
  if (!bt) return { title: "Recenzije" };
  return {
    title: `Recenzije — ${bt.name}`,
    description: `Sve recenzije u kategoriji ${bt.name} na vozilla.hr.`,
    alternates: { canonical: `/recenzije/kategorija/${bt.slug}` },
  };
}

export default async function ReviewCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ kat }, sp, bodyTypes] = await Promise.all([params, searchParams, getBodyTypeOptions()]);
  const bt = bodyTypes.find((b) => b.slug === kat);
  if (!bt) notFound();

  const page = Math.max(1, Number.parseInt(String(sp.p ?? "1"), 10) || 1);
  const result = await listReviews(page, kat);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Recenzije", href: "/recenzije" },
    { name: bt.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Recenzije — {bt.name}</Heading>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {result.reviews.length === 0 ? (
            <p className="text-text-muted text-sm">Nema recenzija u ovoj kategoriji još uvijek.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
