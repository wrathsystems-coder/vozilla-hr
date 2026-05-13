import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import QuizWizard from "@/components/quiz/Wizard";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pomoć pri izboru",
  description:
    "Odgovori na 8 pitanja i mi ćemo ti preporučiti modele koji najbolje odgovaraju tvojim potrebama. Preskoči što god ne znaš — odgovorit ćemo i s djelomičnim odgovorima.",
  alternates: { canonical: "/pomoc-pri-izboru" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Pomoć pri izboru" }];

export default function QuizPage() {
  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Pomoć pri izboru</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Odgovori na nekoliko kratkih pitanja — uvijek možeš preskočiti — i mi ćemo ti
            preporučiti modele koji odgovaraju tvojem stilu vožnje i budžetu.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <div className="mx-auto max-w-2xl">
            <QuizWizard />
          </div>
        </Container>
      </section>
    </>
  );
}
