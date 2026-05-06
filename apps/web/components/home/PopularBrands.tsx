import Link from "next/link";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export default function PopularBrands() {
  return (
    <section className="bg-surface py-16">
      <Container>
        <div className="flex items-end justify-between">
          <Heading level={2}>Popularne marke</Heading>
          <Link
            href="/nova-vozila/marke"
            className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Vidi sve marke →
          </Link>
        </div>

        <Card className="mt-8 text-center">
          <p className="text-text-muted text-sm">Uskoro dostupno.</p>
        </Card>
      </Container>
    </section>
  );
}
