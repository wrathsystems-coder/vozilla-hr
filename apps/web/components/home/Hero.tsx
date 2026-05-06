import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export default function Hero() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container className="text-center">
        <Heading level={1} className="mx-auto max-w-3xl">
          [XXX_HERO_HEADLINE: 5-8 riječi]
        </Heading>
        <p className="text-text-muted mx-auto mt-4 max-w-2xl text-lg">
          [XXX_HERO_SUBHEADLINE: 1-2 rečenice opisa platforme]
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/zatrazi-ponudu"
            className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Zatraži ponudu
          </Link>
          <Link
            href="/pomoc-pri-izboru"
            className="bg-surface-muted text-text hover:bg-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Pomoć pri izboru
          </Link>
        </div>
      </Container>
    </section>
  );
}
