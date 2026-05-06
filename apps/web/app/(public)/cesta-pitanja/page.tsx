import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const metadata: Metadata = {
  title: "Česta pitanja",
};

const faqs = [
  { q: "[XXX_FAQ_1_Q]", a: "[XXX_FAQ_1_A]" },
  { q: "[XXX_FAQ_2_Q]", a: "[XXX_FAQ_2_A]" },
  { q: "[XXX_FAQ_3_Q]", a: "[XXX_FAQ_3_A]" },
  { q: "[XXX_FAQ_4_Q]", a: "[XXX_FAQ_4_A]" },
  { q: "[XXX_FAQ_5_Q]", a: "[XXX_FAQ_5_A]" },
  { q: "[XXX_FAQ_6_Q]", a: "[XXX_FAQ_6_A]" },
  { q: "[XXX_FAQ_7_Q]", a: "[XXX_FAQ_7_A]" },
  { q: "[XXX_FAQ_8_Q]", a: "[XXX_FAQ_8_A]" },
  { q: "[XXX_FAQ_9_Q]", a: "[XXX_FAQ_9_A]" },
  { q: "[XXX_FAQ_10_Q]", a: "[XXX_FAQ_10_A]" },
  { q: "[XXX_FAQ_11_Q]", a: "[XXX_FAQ_11_A]" },
  { q: "[XXX_FAQ_12_Q]", a: "[XXX_FAQ_12_A]" },
  { q: "[XXX_FAQ_13_Q]", a: "[XXX_FAQ_13_A]" },
  { q: "[XXX_FAQ_14_Q]", a: "[XXX_FAQ_14_A]" },
  { q: "[XXX_FAQ_15_Q]", a: "[XXX_FAQ_15_A]" },
  { q: "[XXX_FAQ_16_Q]", a: "[XXX_FAQ_16_A]" },
  { q: "[XXX_FAQ_17_Q]", a: "[XXX_FAQ_17_A]" },
  { q: "[XXX_FAQ_18_Q]", a: "[XXX_FAQ_18_A]" },
  { q: "[XXX_FAQ_19_Q]", a: "[XXX_FAQ_19_A]" },
  { q: "[XXX_FAQ_20_Q]", a: "[XXX_FAQ_20_A]" },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function CestaPitanjaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Container className="py-16">
        <Heading level={1}>Česta pitanja</Heading>
        <p className="text-text-muted mt-4 max-w-2xl text-lg">
          [XXX_FAQ_INTRO: 1-2 rečenice — npr. najčešća pitanja korisnika i naši odgovori]
        </p>

        <ul className="mt-12 space-y-3">
          {faqs.map((item, index) => (
            <li key={index}>
              <details className="border-surface-border bg-surface group rounded-md border p-5">
                <summary className="text-text flex cursor-pointer items-center justify-between gap-4 text-base font-medium">
                  <span>{item.q}</span>
                  <span
                    className="text-text-muted transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="text-text-muted mt-3 text-sm">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
