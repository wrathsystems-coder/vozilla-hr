import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export default function FinalCta() {
  return (
    <section className="bg-brand-accent text-brand-primary py-20">
      <Container className="text-center">
        <Heading level={2}>[XXX_FINAL_CTA_HEADLINE: 5-8 riječi]</Heading>
        <p className="mx-auto mt-3 max-w-2xl">[XXX_FINAL_CTA_BODY: 1-2 rečenice]</p>
        <Link
          href="/zatrazi-ponudu"
          className="bg-brand-primary text-text-inverse focus-visible:outline-brand-primary mt-8 inline-flex items-center justify-center rounded-md px-8 py-4 text-base font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Zatraži ponudu
        </Link>
      </Container>
    </section>
  );
}
