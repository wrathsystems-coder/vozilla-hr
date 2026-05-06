import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";

export default function NewsletterCta() {
  return (
    <section className="bg-surface-muted py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={2}>[XXX_NEWSLETTER_HEADLINE: 4-7 riječi]</Heading>
          <p className="text-text-muted mt-3">[XXX_NEWSLETTER_BODY: 1-2 rečenice]</p>

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
        </div>
      </Container>
    </section>
  );
}
