import type { Metadata } from "next";
import { Eye, MessageSquare, Pencil, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const metadata: Metadata = {
  title: "GDPR zahtjev",
};

const rights = [
  {
    icon: Eye,
    title: "Pravo na pristup",
    body: "[XXX_GDPR_ACCESS_BODY: 1-2 rečenice o pravu pristupa osobnim podacima]",
  },
  {
    icon: Pencil,
    title: "Pravo na ispravak",
    body: "[XXX_GDPR_RECTIFICATION_BODY: 1-2 rečenice o pravu ispravka netočnih podataka]",
  },
  {
    icon: Trash2,
    title: "Pravo na brisanje",
    body: "[XXX_GDPR_ERASURE_BODY: 1-2 rečenice o pravu na brisanje, retention period]",
  },
  {
    icon: MessageSquare,
    title: "Pravo na žalbu",
    body: "[XXX_GDPR_COMPLAINT_BODY: 1-2 rečenice o žalbi AZOP-u i kontaktu DPO-a]",
  },
];

export default function GdprZahtjevPage() {
  return (
    <Container className="py-16">
      <Heading level={1}>GDPR zahtjev</Heading>
      <p className="text-text-muted mt-4 max-w-2xl text-lg">
        [XXX_GDPR_INTRO: 1-2 rečenice o tome kako podnijeti zahtjev, rok obrade]
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {rights.map((right) => (
          <Card key={right.title}>
            <right.icon className="text-brand-accent h-6 w-6" aria-hidden="true" />
            <Heading level={3} className="mt-3">
              {right.title}
            </Heading>
            <p className="text-text-muted mt-2 text-sm">{right.body}</p>
          </Card>
        ))}
      </div>

      <div className="border-surface-border bg-surface-muted mt-12 rounded-md border p-8">
        <Heading level={2}>Podnošenje zahtjeva</Heading>
        <p className="text-text-muted mt-3">
          Forma za podnošenje zahtjeva uskoro je dostupna. Do tada nas možete kontaktirati izravno
          na DPO email adresu:
        </p>
        <p className="mt-4">
          <a
            href="mailto:[XXX_CONTACT_EMAIL_DPO]"
            className="text-text hover:text-brand-accent focus-visible:outline-brand-accent text-sm font-medium underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            [XXX_CONTACT_EMAIL_DPO]
          </a>
        </p>
      </div>
    </Container>
  );
}
