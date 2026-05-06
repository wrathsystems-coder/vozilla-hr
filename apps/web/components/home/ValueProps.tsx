import { Search, ShieldCheck, Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

const items = [
  {
    icon: Search,
    title: "[XXX_VP_1_TITLE: 3-5 riječi]",
    body: "[XXX_VP_1_BODY: 1-2 rečenice]",
  },
  {
    icon: ShieldCheck,
    title: "[XXX_VP_2_TITLE: 3-5 riječi]",
    body: "[XXX_VP_2_BODY: 1-2 rečenice]",
  },
  {
    icon: Wallet,
    title: "[XXX_VP_3_TITLE: 3-5 riječi]",
    body: "[XXX_VP_3_BODY: 1-2 rečenice]",
  },
];

export default function ValueProps() {
  return (
    <section className="bg-surface-muted py-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <Icon className="text-brand-accent h-8 w-8" aria-hidden="true" />
              <Heading level={3} className="mt-4">
                {title}
              </Heading>
              <p className="text-text-muted mt-2 text-sm">{body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
