import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { now } from "@/lib/utils/time";

const dateFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type LegalPageShellProps = {
  title: string;
  contentPlaceholder: string;
  pdfHref?: string;
};

export default function LegalPageShell({
  title,
  contentPlaceholder,
  pdfHref,
}: LegalPageShellProps) {
  const lastUpdated = dateFmt.format(now());

  return (
    <Container className="py-16">
      <Heading level={1}>{title}</Heading>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-muted text-sm">Posljednja izmjena: {lastUpdated}.</p>
        {pdfHref ? (
          <a
            href={pdfHref}
            download
            className="bg-surface-muted text-text hover:bg-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Preuzmi PDF
          </a>
        ) : (
          <Button variant="secondary" size="md" disabled>
            Preuzmi PDF (uskoro)
          </Button>
        )}
      </div>

      <article className="text-text-muted mt-10 max-w-3xl whitespace-pre-wrap">
        {contentPlaceholder}
      </article>
    </Container>
  );
}
