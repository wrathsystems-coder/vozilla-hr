import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getLegalPage, type LegalSlug } from "@/lib/legal/pages";
import { now } from "@/lib/utils/time";

const dateFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type LegalPageShellProps = {
  slug: LegalSlug;
};

export default function LegalPageShell({ slug }: LegalPageShellProps) {
  const page = getLegalPage(slug);
  if (!page) {
    // Defensive — slug is typed so this branch is unreachable in practice,
    // but log so a future registry edit that drops a slug fails loud
    // rather than rendering a blank legal page.
    console.error(`LegalPageShell: unknown slug ${slug}`);
    return null;
  }

  const lastUpdated = dateFmt.format(now());

  return (
    <Container className="py-16">
      <Heading level={1}>{page.title}</Heading>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-muted text-sm">Posljednja izmjena: {lastUpdated}.</p>
        <a
          href={`/print/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface-muted text-text hover:bg-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Preuzmi PDF
        </a>
      </div>

      <article className="text-text-muted mt-10 max-w-3xl whitespace-pre-wrap">
        {page.placeholder}
      </article>
    </Container>
  );
}
