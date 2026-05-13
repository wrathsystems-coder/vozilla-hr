import Link from "next/link";
import { filterToQueryString, type UsedCarFilter } from "@/lib/used-cars/filter";

/**
 * Server-rendered pagination. Prev / Next + a sliding window of page
 * numbers around the current page (max 5 numeric pages). Each link
 * preserves the active filter and just changes `p=`.
 */

type Props = {
  filter: UsedCarFilter;
  totalPages: number;
};

function hrefForPage(filter: UsedCarFilter, page: number): string {
  const qs = filterToQueryString({ ...filter, page });
  return qs ? `/rabljena-vozila?${qs}` : "/rabljena-vozila";
}

function visiblePages(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  // Slide a 5-wide window. Clamp at the edges so we always show 5.
  let start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  if (end - start < 4) start = end - 4;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({ filter, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const current = filter.page;
  const pages = visiblePages(current, totalPages);
  const hasPrev = current > 1;
  const hasNext = current < totalPages;

  return (
    <nav aria-label="Stranice rezultata" className="flex items-center justify-center gap-2 py-8">
      <PageLink
        href={hrefForPage(filter, current - 1)}
        disabled={!hasPrev}
        label="‹ Prethodna"
        ariaLabel="Prethodna stranica"
      />
      {pages[0] > 1 ? (
        <>
          <PageLink href={hrefForPage(filter, 1)} label="1" />
          {pages[0] > 2 ? <span className="text-text-muted px-1">…</span> : null}
        </>
      ) : null}
      {pages.map((p) => (
        <PageLink
          key={p}
          href={hrefForPage(filter, p)}
          label={String(p)}
          isCurrent={p === current}
        />
      ))}
      {pages[pages.length - 1] < totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? (
            <span className="text-text-muted px-1">…</span>
          ) : null}
          <PageLink href={hrefForPage(filter, totalPages)} label={String(totalPages)} />
        </>
      ) : null}
      <PageLink
        href={hrefForPage(filter, current + 1)}
        disabled={!hasNext}
        label="Sljedeća ›"
        ariaLabel="Sljedeća stranica"
      />
    </nav>
  );
}

function PageLink({
  href,
  label,
  isCurrent,
  disabled,
  ariaLabel,
}: {
  href: string;
  label: string;
  isCurrent?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const base = "min-w-[2.25rem] rounded-md px-3 py-1.5 text-center text-sm";
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} text-text-muted/50 cursor-not-allowed`}>
        {label}
      </span>
    );
  }
  if (isCurrent) {
    return (
      <span
        aria-current="page"
        className={`${base} bg-brand-accent text-brand-primary font-medium`}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`${base} border-surface-border text-text-muted hover:text-text border`}
    >
      {label}
    </Link>
  );
}
