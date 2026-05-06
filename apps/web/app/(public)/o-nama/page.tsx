import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const metadata: Metadata = {
  title: "O nama",
};

const sections = [
  { title: "Misija", body: "[XXX_ABOUT_MISSION_BODY: 2-3 rečenice o misiji platforme]" },
  { title: "Pristup", body: "[XXX_ABOUT_APPROACH_BODY: 2-3 rečenice o našem pristupu]" },
  { title: "Tim", body: "[XXX_ABOUT_TEAM_BODY: 2-3 rečenice o timu i osnivačima]" },
];

export default function ONamaPage() {
  return (
    <Container className="py-16">
      <Heading level={1}>O nama</Heading>
      <p className="text-text-muted mt-4 max-w-2xl text-lg">
        [XXX_ABOUT_INTRO: 1-2 rečenice uvoda]
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {sections.map((section) => (
          <section key={section.title}>
            <Heading level={2}>{section.title}</Heading>
            <p className="text-text-muted mt-3">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
