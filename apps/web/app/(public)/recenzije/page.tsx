import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ReviewCard from "@/components/editorial/ReviewCard";
import { listReviews } from "@/lib/reviews/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Recenzije",
  description:
    "Detaljne recenzije novih vozila na hrvatskom tržištu. Ocjene, prednosti i mane, fotografije i preporuke za istraživanje, usporedbu i kupnju.",
  alternates: { canonical: "/recenzije" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Recenzije" }];

export default async function RecenzijePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.p ?? "1"), 10) || 1);
  const result = await listReviews(page);

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Recenzije</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Detaljne recenzije novih vozila — što vrijedi, što ne, i je li model pravi za tebe.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {result.reviews.length === 0 ? (
            <div className="border-surface-border bg-surface rounded-md border p-8 text-center">
              <Heading level={2} className="text-lg">
                Recenzije se trenutno popunjavaju
              </Heading>
              <p className="text-text-muted mt-2 text-sm">
                Uskoro objavljujemo prve recenzije — vrati se za nekoliko dana.
              </p>
            </div>
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
