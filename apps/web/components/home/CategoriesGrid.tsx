import Link from "next/link";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

const categories = [
  { name: "Sedan", slug: "sedan" },
  { name: "SUV", slug: "suv" },
  { name: "Hatchback", slug: "hatchback" },
  { name: "Karavan", slug: "karavan" },
  { name: "Coupé", slug: "coupe" },
  { name: "Cabriolet", slug: "cabriolet" },
] as const;

export default function CategoriesGrid() {
  return (
    <section className="bg-surface-muted py-16">
      <Container>
        <div className="flex items-end justify-between">
          <Heading level={2}>Kategorije</Heading>
          <Link
            href="/nova-vozila/kategorije"
            className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Vidi sve kategorije →
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/nova-vozila/kategorije/${category.slug}`}
                className="focus-visible:outline-brand-accent block focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Card className="hover:bg-surface-border text-center transition-colors">
                  <div
                    className="bg-surface-border mx-auto h-16 w-full rounded-md"
                    aria-hidden="true"
                  />
                  <p className="text-text mt-3 text-sm font-medium">{category.name}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
