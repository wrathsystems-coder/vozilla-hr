import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";
import NewsletterForm from "@/components/widgets/NewsletterForm";
import { isEnabled } from "@/lib/feature-flags";

export default function NewsletterCta() {
  const enabled = isEnabled("newsletter");

  return (
    <section className="bg-surface-muted py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={2}>[XXX_NEWSLETTER_HEADLINE: 4-7 riječi]</Heading>
          <p className="text-text-muted mt-3">[XXX_NEWSLETTER_BODY: 1-2 rečenice]</p>

          {enabled ? (
            <NewsletterForm variant="hero" sourceForm="home_cta" />
          ) : (
            <form aria-label="Pretplata na newsletter" className="mt-6">
              <label htmlFor="home-newsletter-email" className="sr-only">
                Email adresa
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Input
                  id="home-newsletter-email"
                  type="email"
                  disabled
                  placeholder="vaš@email.hr"
                  className="sm:max-w-xs"
                />
                <Button type="submit" variant="primary" size="md" disabled>
                  Pretplati se
                </Button>
              </div>
              <p className="text-text-muted mt-3 text-xs">Newsletter je uskoro dostupan.</p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
