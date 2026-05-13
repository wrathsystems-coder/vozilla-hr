import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Calculator from "@/components/leasing/Calculator";
import { getLeasingDefaults } from "@/lib/leasing/defaults";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Leasing kalkulator",
  description:
    "Informativni leasing kalkulator — unesi cijenu vozila, polog i period i odmah vidiš procijenjenu mjesečnu ratu te ukupne troškove operativnog ili financijskog leasinga.",
  alternates: { canonical: "/leasing/kalkulator" },
};

const breadcrumbs = [
  { name: "Početna", href: "/" },
  { name: "Leasing", href: "/leasing" },
  { name: "Kalkulator" },
];

export default async function LeasingKalkulatorPage() {
  const defaults = await getLeasingDefaults();
  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Leasing kalkulator</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Pomakni klizače da bi vidio kako cijena, polog, period i kamatna stopa utječu na
            mjesečnu ratu. Konačnu ponudu radi banka ili leasing kuća — ovo je samo procjena.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <Calculator defaults={defaults} />
        </Container>
      </section>
    </>
  );
}
