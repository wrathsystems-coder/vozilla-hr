import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const metadata: Metadata = {
  title: "Kontakt",
};

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: "[XXX_CONTACT_EMAIL_GENERAL]",
    href: "mailto:[XXX_CONTACT_EMAIL_GENERAL]",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "[XXX_CONTACT_PHONE]",
    href: "tel:[XXX_CONTACT_PHONE]",
  },
  {
    icon: MapPin,
    label: "Adresa",
    value: "[XXX_COMPANY_STREET], [XXX_COMPANY_POSTCODE] [XXX_COMPANY_CITY]",
    href: null,
  },
];

export default function KontaktPage() {
  return (
    <Container className="py-16">
      <Heading level={1}>Kontakt</Heading>
      <p className="text-text-muted mt-4 max-w-2xl text-lg">
        [XXX_CONTACT_INTRO: 1-2 rečenice o tome kako i kada nas kontaktirati]
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.label}>
            <channel.icon className="text-brand-accent h-6 w-6" aria-hidden="true" />
            <Heading level={3} className="mt-3">
              {channel.label}
            </Heading>
            {channel.href ? (
              <a
                href={channel.href}
                className="text-text-muted hover:text-text focus-visible:outline-brand-accent mt-2 block text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {channel.value}
              </a>
            ) : (
              <p className="text-text-muted mt-2 text-sm">{channel.value}</p>
            )}
          </Card>
        ))}
      </div>
    </Container>
  );
}
