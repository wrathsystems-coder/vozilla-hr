import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import NewsletterForm from "@/components/widgets/NewsletterForm";
import { isEnabled } from "@/lib/feature-flags";
import { now } from "@/lib/utils/time";
import { footerColumns } from "./nav-items";

export default function Footer() {
  const year = now().getFullYear();
  const newsletterEnabled = isEnabled("newsletter");

  return (
    <footer className="border-surface-border bg-surface-muted mt-16 border-t">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label="vozilla.hr — početna"
              className="focus-visible:outline-brand-accent text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              vozilla.hr
            </Link>
            <p className="text-text-muted mt-3 text-sm">[XXX_TAGLINE: 8-12 riječi]</p>

            {newsletterEnabled ? (
              <NewsletterForm variant="footer" sourceForm="footer" />
            ) : (
              <form aria-label="Pretplata na newsletter" className="mt-6">
                <label
                  htmlFor="newsletter-email"
                  className="text-text-muted block text-xs font-medium"
                >
                  Newsletter (uskoro)
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="newsletter-email"
                    type="email"
                    disabled
                    placeholder="vaš@email.hr"
                    className="flex-1"
                  />
                  <Button type="submit" variant="secondary" size="md" disabled>
                    Pretplati se
                  </Button>
                </div>
              </form>
            )}
          </div>

          <nav aria-label="Podnožje" className="md:col-span-3">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h2 className="text-text text-sm font-semibold">{column.title}</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {column.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="border-surface-border text-text-muted mt-12 border-t pt-6 text-sm">
          <p>© {year} vozilla.hr. Sva prava pridržana.</p>
        </div>
      </Container>
    </footer>
  );
}
