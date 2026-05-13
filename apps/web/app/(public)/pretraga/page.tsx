import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { MIN_QUERY_LENGTH, search, type SearchGroup, type SearchItem } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pretraga",
  description: "Pretraži marke, modele, recenzije, savjete i oglase rabljenih vozila.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/pretraga" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Pretraga" }];

const GROUP_LABEL: Record<SearchGroup, string> = {
  brands: "Marke",
  models: "Modeli",
  reviews: "Recenzije",
  articles: "Savjeti",
  used_cars: "Rabljeni oglasi",
};

const GROUP_SEE_ALL: Record<SearchGroup, string> = {
  brands: "/nova-vozila/marke",
  models: "/nova-vozila/marke",
  reviews: "/recenzije",
  articles: "/savjeti",
  used_cars: "/rabljena-vozila",
};

export default async function PretragaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const results = q.length >= MIN_QUERY_LENGTH ? await search(q, 12) : null;

  return (
    <>
      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Pretraga</Heading>
          <form action="/pretraga" method="GET" role="search" className="mt-6 flex max-w-2xl gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              autoFocus
              minLength={MIN_QUERY_LENGTH}
              placeholder="Pretraži marke, modele, recenzije..."
              aria-label="Pretraga"
              className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-full rounded-md border px-4 py-3 text-sm focus:ring-1"
            />
            <button
              type="submit"
              className="bg-brand-accent text-brand-primary rounded-md px-5 py-3 text-sm font-semibold hover:opacity-90"
            >
              Pretraži
            </button>
          </form>
          {q.length > 0 && q.length < MIN_QUERY_LENGTH ? (
            <p className="text-text-muted mt-3 text-sm">Unesi barem {MIN_QUERY_LENGTH} znakova.</p>
          ) : null}
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {results == null ? (
            <p className="text-text-muted text-sm">
              Pretraga ide kroz marke, modele, recenzije, savjete i rabljene oglase.
            </p>
          ) : results.total === 0 ? (
            <NoResults q={q} />
          ) : (
            <div className="space-y-8">
              {(Object.keys(results.byGroup) as SearchGroup[]).map((group) => {
                const items = results.byGroup[group];
                if (items.length === 0) return null;
                return (
                  <section key={group}>
                    <div className="mb-3 flex items-baseline justify-between">
                      <h2 className="text-text text-lg font-semibold">
                        {GROUP_LABEL[group]}{" "}
                        <span className="text-text-muted text-sm font-normal">
                          ({items.length})
                        </span>
                      </h2>
                      <Link
                        href={GROUP_SEE_ALL[group]}
                        className="text-text-muted hover:text-text text-sm underline"
                      >
                        Vidi sve
                      </Link>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {items.map((item, i) => (
                        <li key={`${group}-${i}`}>
                          <ResultRow item={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function ResultRow({ item }: { item: SearchItem }) {
  return (
    <Link
      href={item.href}
      className="border-surface-border bg-surface hover:border-brand-accent block rounded-md border p-3 transition-colors"
    >
      <p className="text-text text-sm font-medium">{item.title}</p>
      {item.subtitle ? <p className="text-text-muted mt-0.5 text-xs">{item.subtitle}</p> : null}
    </Link>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-8 text-center">
      <Heading level={2} className="text-lg">
        Nema rezultata za &ldquo;{q}&rdquo;
      </Heading>
      <p className="text-text-muted mt-2 text-sm">
        Pokušaj s drugim riječima ili pretraži kroz hub-ove:
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          href="/nova-vozila/marke"
          className="bg-surface-muted text-text hover:bg-surface-border rounded-md px-3 py-2 text-sm"
        >
          Marke
        </Link>
        <Link
          href="/rabljena-vozila"
          className="bg-surface-muted text-text hover:bg-surface-border rounded-md px-3 py-2 text-sm"
        >
          Rabljena vozila
        </Link>
        <Link
          href="/recenzije"
          className="bg-surface-muted text-text hover:bg-surface-border rounded-md px-3 py-2 text-sm"
        >
          Recenzije
        </Link>
        <Link
          href="/savjeti"
          className="bg-surface-muted text-text hover:bg-surface-border rounded-md px-3 py-2 text-sm"
        >
          Savjeti
        </Link>
      </div>
    </div>
  );
}
