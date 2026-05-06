import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { now } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Kako provjeravamo recenzije",
};

const sections = [
  {
    title: "Prikupljanje recenzija",
    body: "[XXX_REVIEW_VETTING_COLLECT_BODY: 2-3 rečenice o tome kako prikupljamo recenzije]",
  },
  {
    title: "Provjera autentičnosti",
    body: "[XXX_REVIEW_VETTING_AUTH_BODY: 2-3 rečenice o procesu provjere]",
  },
  {
    title: "Objava i moderacija",
    body: "[XXX_REVIEW_VETTING_PUBLISH_BODY: 2-3 rečenice o tome kako objavljujemo i moderiramo]",
  },
  {
    title: "Pravo na žalbu",
    body: "[XXX_REVIEW_VETTING_APPEAL_BODY: 2-3 rečenice o tome kako se podnosi žalba]",
  },
];

const lastUpdatedFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function KakoProvjeravamoRecenzijePage() {
  const lastUpdated = lastUpdatedFmt.format(now());

  return (
    <Container className="py-16">
      <Heading level={1}>Kako provjeravamo recenzije</Heading>
      <p className="text-text-muted mt-4 max-w-2xl text-lg">
        [XXX_REVIEW_VETTING_INTRO: 1-2 rečenice o transparentnosti procesa, DSA compliance]
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <Heading level={2}>{section.title}</Heading>
            <p className="text-text-muted mt-3 max-w-2xl">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="text-text-muted mt-16 text-sm">Posljednja izmjena: {lastUpdated}.</p>
    </Container>
  );
}
