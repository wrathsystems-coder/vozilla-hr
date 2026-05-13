import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ArticleCard from "@/components/editorial/ArticleCard";
import { listArticles } from "@/lib/articles/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Savjeti",
  description:
    "Vodiči i savjeti za kupnju, prodaju i održavanje vozila u Hrvatskoj. Sve što trebaš znati prije nego potpišeš.",
  alternates: { canonical: "/savjeti" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Savjeti" }];

const CATEGORIES: { slug: "vodici" | "savjeti" | "vijesti" | "tehnologija"; label: string }[] = [
  { slug: "vodici", label: "Vodiči" },
  { slug: "savjeti", label: "Savjeti" },
  { slug: "vijesti", label: "Vijesti" },
  { slug: "tehnologija", label: "Tehnologija" },
];

export default async function SavjetiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.p ?? "1"), 10) || 1);
  const result = await listArticles(page);

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Savjeti</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Vodiči za kupnju, savjeti za održavanje, novosti s tržišta i tehnološka pozadina.
          </p>
          <nav aria-label="Kategorije" className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/savjeti/kategorija/${c.slug}`}
                className="border-surface-border text-text-muted hover:text-text rounded-full border px-3 py-1 text-sm"
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {result.articles.length === 0 ? (
            <div className="border-surface-border bg-surface rounded-md border p-8 text-center">
              <Heading level={2} className="text-lg">
                Savjeti se trenutno popunjavaju
              </Heading>
              <p className="text-text-muted mt-2 text-sm">
                Uskoro objavljujemo prve vodiče — vrati se za nekoliko dana.
              </p>
            </div>
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
