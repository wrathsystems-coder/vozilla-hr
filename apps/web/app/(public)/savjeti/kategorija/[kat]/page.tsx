import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ArticleCard from "@/components/editorial/ArticleCard";
import { listArticles, type ArticleCategory } from "@/lib/articles/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

type Params = { kat: string };

const CATEGORIES: { slug: ArticleCategory; label: string }[] = [
  { slug: "vodici", label: "Vodiči" },
  { slug: "savjeti", label: "Savjeti" },
  { slug: "vijesti", label: "Vijesti" },
  { slug: "tehnologija", label: "Tehnologija" },
];

const SLUG_TO_LABEL = new Map(CATEGORIES.map((c) => [c.slug, c.label]));

export async function generateStaticParams(): Promise<Params[]> {
  return CATEGORIES.map((c) => ({ kat: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { kat } = await params;
  const label = SLUG_TO_LABEL.get(kat as ArticleCategory);
  if (!label) return { title: "Savjeti" };
  return {
    title: label,
    description: `Sve objavljene stavke u kategoriji ${label} na vozilla.hr.`,
    alternates: { canonical: `/savjeti/kategorija/${kat}` },
  };
}

export default async function ArticleCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ kat }, sp] = await Promise.all([params, searchParams]);
  const slug = kat as ArticleCategory;
  const label = SLUG_TO_LABEL.get(slug);
  if (!label) notFound();

  const page = Math.max(1, Number.parseInt(String(sp.p ?? "1"), 10) || 1);
  const result = await listArticles(page, slug);

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Savjeti", href: "/savjeti" },
    { name: label },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>{label}</Heading>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {result.articles.length === 0 ? (
            <p className="text-text-muted text-sm">
              Nema objavljenih stavki u ovoj kategoriji još uvijek.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.articles.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
