import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getMarketingCopy } from "@/lib/marketing/copy";

// Hero is async server component reading from the MarketingCopy global
// so admin edits in Payload propagate to homepage. Fallback strings are
// the original `[XXX_*]` markers — kept so a fresh DB still surfaces the
// "this needs CMS content" cue. revalidateTag('marketing_copy') is wired
// on the global's afterChange hook so saved edits invalidate instantly.

export default async function Hero() {
  const { hero } = await getMarketingCopy();
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container className="text-center">
        <Heading level={1} className="mx-auto max-w-3xl">
          {hero.headline}
        </Heading>
        <p className="text-text-muted mx-auto mt-4 max-w-2xl text-lg">{hero.subheadline}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={hero.primaryCtaHref}
            className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {hero.primaryCtaLabel}
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
