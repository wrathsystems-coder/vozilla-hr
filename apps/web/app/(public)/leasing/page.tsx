import type { Metadata } from "next";
import Link from "next/link";
import { Calculator as CalculatorIcon, BookOpen } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Leasing",
  description:
    "Informativni leasing kalkulator i vodič — saznaj koliko bi mjesečna rata mogla iznositi i koja je razlika između operativnog i financijskog leasinga.",
  alternates: { canonical: "/leasing" },
};

const breadcrumbs = [{ name: "Početna", href: "/" }, { name: "Leasing" }];

export default function LeasingHubPage() {
  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>Leasing</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            Procijeni mjesečnu ratu, usporedi operativni i financijski leasing, i pošalji upit
            dilerima — sve s jednog mjesta.
          </p>
        </Container>
      </section>

      <section className="bg-surface-muted py-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <HubCard
              href="/leasing/kalkulator"
              icon={CalculatorIcon}
              title="Leasing kalkulator"
              description="Unesi cijenu, polog i period — odmah vidiš procijenjenu mjesečnu ratu i ukupne troškove."
              cta="Otvori kalkulator"
            />
            <HubCard
              href="/leasing/vodic"
              icon={BookOpen}
              title="Vodič kroz leasing"
              description="Što je leasing, vrste, ključni pojmovi i prava koja imaš kao korisnik."
              cta="Pročitaj vodič"
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function HubCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="border-surface-border bg-surface hover:border-brand-accent group flex flex-col gap-3 rounded-md border p-6 transition-colors"
    >
      <Icon className="text-brand-accent h-8 w-8" aria-hidden="true" />
      <h2 className="text-text text-xl font-semibold">{title}</h2>
      <p className="text-text-muted text-sm">{description}</p>
      <span className="text-brand-accent mt-2 text-sm font-medium group-hover:underline">
        {cta} →
      </span>
    </Link>
  );
}
