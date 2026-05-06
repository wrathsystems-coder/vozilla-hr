import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const metadata: Metadata = {
  title: "Kako funkcionira",
};

const steps = [
  { title: "[XXX_HIW_FULL_1_TITLE]", body: "[XXX_HIW_FULL_1_BODY: 2-3 rečenice]" },
  { title: "[XXX_HIW_FULL_2_TITLE]", body: "[XXX_HIW_FULL_2_BODY: 2-3 rečenice]" },
  { title: "[XXX_HIW_FULL_3_TITLE]", body: "[XXX_HIW_FULL_3_BODY: 2-3 rečenice]" },
  { title: "[XXX_HIW_FULL_4_TITLE]", body: "[XXX_HIW_FULL_4_BODY: 2-3 rečenice]" },
  { title: "[XXX_HIW_FULL_5_TITLE]", body: "[XXX_HIW_FULL_5_BODY: 2-3 rečenice]" },
  { title: "[XXX_HIW_FULL_6_TITLE]", body: "[XXX_HIW_FULL_6_BODY: 2-3 rečenice]" },
];

export default function KakoFunkcioniraPage() {
  return (
    <Container className="py-16">
      <Heading level={1}>Kako funkcionira</Heading>
      <p className="text-text-muted mt-4 max-w-2xl text-lg">
        [XXX_HIW_FULL_INTRO: 1-2 rečenice o procesu od pretrage do ponude]
      </p>

      <ol className="mt-12 space-y-10">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-6">
            <div
              className="bg-brand-accent text-brand-primary flex h-12 w-12 flex-none items-center justify-center rounded-full text-lg font-bold"
              aria-hidden="true"
            >
              {index + 1}
            </div>
            <div>
              <Heading level={2}>{step.title}</Heading>
              <p className="text-text-muted mt-2 max-w-2xl">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  );
}
