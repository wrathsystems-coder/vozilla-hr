import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryCard from "@/components/catalog/CategoryCard";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getAllBodyTypes } from "@/lib/catalog/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sve kategorije vozila",
  description:
    "Pregledaj vozila po kategoriji karoserije: SUV, hatchback, limuzina, karavan, crossover i drugi.",
  alternates: { canonical: "/nova-vozila/kategorije" },
};

export default async function KategorijePage() {
  const bodyTypes = await getAllBodyTypes();

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: "/nova-vozila" },
    { name: "Kategorije" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Sve kategorije</Heading>
          <p className="text-text-muted mt-4 max-w-2xl">
            Odaberi tip karoserije koja ti najbolje odgovara — od kompaktnog hatchbacka do
            prostranog SUV-a.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-12">
        <Container>
          {bodyTypes.length === 0 ? (
            <p className="text-text-muted text-sm">Nema dostupnih kategorija.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {bodyTypes.map((bt) => (
                <li key={bt.id}>
                  <CategoryCard bodyType={bt} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
