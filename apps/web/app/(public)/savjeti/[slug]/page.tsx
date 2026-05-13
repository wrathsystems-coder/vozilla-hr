import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { LexicalRenderer } from "@/components/lexical/render";
import { getArticleBySlug } from "@/lib/articles/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";
import { siteUrl } from "@/lib/seo/site-url";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 3600;

type Params = { slug: string };

const CATEGORY_LABEL: Record<string, string> = {
  vodici: "Vodiči",
  savjeti: "Savjeti",
  vijesti: "Vijesti",
  tehnologija: "Tehnologija",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Savjeti" };
  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.excerpt || article.title,
    alternates: { canonical: `/savjeti/${article.slug}` },
  };
}

export default async function ArticleSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const categoryLabel = article.category_slug ? CATEGORY_LABEL[article.category_slug] : null;

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Savjeti", href: "/savjeti" },
    ...(article.category_slug && categoryLabel
      ? [{ name: categoryLabel, href: `/savjeti/kategorija/${article.category_slug}` }]
      : []),
    { name: article.title },
  ];

  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    url: `${siteUrl()}/savjeti/${article.slug}`,
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    ...(article.hero_image_path ? { image: `${siteUrl()}${article.hero_image_path}` } : {}),
    ...(article.excerpt ? { description: article.excerpt } : {}),
  };

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
      <JsonLd data={articleJsonLd} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          {categoryLabel ? (
            <p className="text-text-muted text-xs uppercase tracking-wide">{categoryLabel}</p>
          ) : null}
          <Heading level={1} className="mt-2">
            {article.title}
          </Heading>
          {article.excerpt ? (
            <p className="text-text-muted mt-3 max-w-2xl text-base">{article.excerpt}</p>
          ) : null}
          {article.published_at ? (
            <p className="text-text-muted mt-3 text-xs">
              Objavljeno {formatDate(article.published_at.slice(0, 10))}
            </p>
          ) : null}
        </Container>
      </section>

      {article.hero_image_path ? (
        <section className="bg-surface-muted py-6">
          <Container>
            <div className="bg-surface-muted aspect-[16/9] w-full overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.hero_image_path}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          </Container>
        </section>
      ) : null}

      <section className="bg-surface py-10">
        <Container>
          <article className="max-w-3xl">
            {article.content ? <LexicalRenderer content={article.content} /> : null}
          </article>
        </Container>
      </section>
    </>
  );
}
