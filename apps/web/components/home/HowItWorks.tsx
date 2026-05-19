import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getMarketingCopy } from "@/lib/marketing/copy";

// Reads from MarketingCopy global. Admin can edit 3 steps; fallback
// keeps `[XXX_*]` placeholders so placeholder-check picks them up
// before content is authored.

const FALLBACK_STEPS = [
  { n: 1, title: "[XXX_HIW_1_TITLE: 2-4 riječi]", body: "[XXX_HIW_1_BODY: 1-2 rečenice]" },
  { n: 2, title: "[XXX_HIW_2_TITLE: 2-4 riječi]", body: "[XXX_HIW_2_BODY: 1-2 rečenice]" },
  { n: 3, title: "[XXX_HIW_3_TITLE: 2-4 riječi]", body: "[XXX_HIW_3_BODY: 1-2 rečenice]" },
];

export default async function HowItWorks() {
  const { howItWorks } = await getMarketingCopy();
  const steps =
    howItWorks.length > 0
      ? howItWorks.map((s) => ({ n: s.stepNumber, title: s.title, body: s.description }))
      : FALLBACK_STEPS;

  return (
    <section className="bg-surface py-16">
      <Container>
        <div className="text-center">
          <Heading level={2}>Kako funkcionira</Heading>
          <p className="text-text-muted mx-auto mt-2 max-w-2xl">
            Tri jednostavna koraka od pretrage do ponude.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="text-center">
              <div
                className="bg-brand-accent text-brand-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                aria-hidden="true"
              >
                {step.n}
              </div>
              <Heading level={3} className="mt-4">
                {step.title}
              </Heading>
              <p className="text-text-muted mt-2 text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
