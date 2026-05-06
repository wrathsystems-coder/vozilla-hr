import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export default function QuizCta() {
  return (
    <section className="bg-surface py-16">
      <Container>
        <div className="border-surface-border bg-surface-muted rounded-md border p-8 text-center sm:p-12">
          <Heading level={2}>[XXX_QUIZ_CTA_HEADLINE: 6-10 riječi]</Heading>
          <p className="text-text-muted mx-auto mt-3 max-w-2xl">
            [XXX_QUIZ_CTA_BODY: 1-2 rečenice]
          </p>
          <Link
            href="/pomoc-pri-izboru"
            className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent mt-6 inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Pokreni kviz
          </Link>
        </div>
      </Container>
    </section>
  );
}
