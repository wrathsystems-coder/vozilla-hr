import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BrandsFilteredGrid from "@/components/catalog/BrandsFilteredGrid";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getAllActiveBrands } from "@/lib/catalog/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sve marke novih vozila",
  description:
    "Abecedni popis svih marki novih vozila dostupnih na vozilla.hr. Pretraži po nazivu i otkrij modele.",
  alternates: { canonical: "/nova-vozila/marke" },
};

export default async function MarkePage() {
  const brands = await getAllActiveBrands();

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Nova vozila", href: "/nova-vozila" },
    { name: "Sve marke" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Sve marke</Heading>
          <p className="text-text-muted mt-4 max-w-2xl">
            {brands.length === 0
              ? "Katalog se trenutno popunjava — povratak uskoro."
              : `Trenutno pratimo ${brands.length} marki. Klikni na marku za prikaz dostupnih modela.`}
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-12">
        <Container>
          {brands.length === 0 ? (
            <p className="text-text-muted text-sm">
              Marke se trenutno ne mogu prikazati. Pokušaj ponovno kasnije.
            </p>
          ) : (
            <BrandsFilteredGrid brands={brands} />
          )}
        </Container>
      </section>
    </>
  );
}
