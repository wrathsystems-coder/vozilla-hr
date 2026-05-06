import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { now } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Impressum",
};

const dateFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type Field = { term: string; value: string };

const sections: { title: string; fields: Field[] }[] = [
  {
    title: "Identifikacija",
    fields: [
      { term: "Pravni naziv", value: "[XXX_COMPANY_LEGAL_NAME]" },
      { term: "OIB", value: "[XXX_COMPANY_OIB]" },
      { term: "MBS", value: "[XXX_COMPANY_MBS]" },
    ],
  },
  {
    title: "Adresa sjedišta",
    fields: [
      { term: "Ulica i broj", value: "[XXX_COMPANY_STREET]" },
      { term: "Grad", value: "[XXX_COMPANY_CITY]" },
      { term: "Poštanski broj", value: "[XXX_COMPANY_POSTCODE]" },
      { term: "Država", value: "Hrvatska" },
    ],
  },
  {
    title: "Sudski registar",
    fields: [
      { term: "Sud", value: "[XXX_COURT_REGISTER_NAME]" },
      { term: "Registarski broj", value: "[XXX_COURT_REGISTRATION_NUMBER]" },
    ],
  },
  {
    title: "Temeljni kapital",
    fields: [{ term: "Iznos", value: "[XXX_SHARE_CAPITAL_AMOUNT] EUR (uplaćen u cijelosti)" }],
  },
  {
    title: "Vodstvo",
    fields: [{ term: "Direktor", value: "[XXX_DIRECTOR_NAME]" }],
  },
  {
    title: "Kontakt",
    fields: [
      { term: "Email", value: "[XXX_CONTACT_EMAIL_GENERAL]" },
      { term: "Telefon", value: "[XXX_CONTACT_PHONE]" },
    ],
  },
  {
    title: "Banka",
    fields: [
      { term: "Naziv banke", value: "[XXX_BANK_NAME]" },
      { term: "IBAN", value: "[XXX_BANK_IBAN]" },
      { term: "SWIFT/BIC", value: "[XXX_BANK_SWIFT]" },
    ],
  },
];

export default function ImpressumPage() {
  const lastUpdated = dateFmt.format(now());

  return (
    <Container className="py-16">
      <Heading level={1}>Impressum</Heading>
      <p className="text-text-muted mt-4 text-sm">Posljednja izmjena: {lastUpdated}.</p>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <Heading level={2}>{section.title}</Heading>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[max-content_1fr]">
              {section.fields.map((field) => (
                <div key={field.term} className="contents">
                  <dt className="text-text text-sm font-medium">{field.term}</dt>
                  <dd className="text-text-muted text-sm">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Container>
  );
}
