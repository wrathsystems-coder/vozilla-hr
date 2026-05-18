import Link from "next/link";
import { filterToQueryString, type VehicleFilter } from "@/lib/catalog/filter";

/**
 * Pagination for /nova-vozila/ listings. Server-rendered, no JS — each
 * page is a `<Link>` to the same path with `p=N` swapped. Implements
 * the same sliding 5-page window with ellipsis used elsewhere in the
 * site (lib/used-cars listings, etc).
 */

type Props = {
  filter: VehicleFilter;
  totalPages: number;
  action: string;
};

export default function CatalogPagination({ filter, totalPages, action }: Props) {
  if (totalPages <= 1) return null;
  const page = filter.page;
  const pages = pageWindow(page, totalPages);

  function hrefForPage(p: number): string {
    const next: VehicleFilter = { ...filter, page: p };
    const qs = filterToQueryString(next);
    return qs ? `${action}?${qs}` : action;
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Stranice">
      {page > 1 && (
        <Link
          href={hrefForPage(page - 1)}
          prefetch={false}
          className="text-text hover:bg-surface-muted rounded-md px-3 py-2 text-sm"
        >
          ← Prethodna
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="text-text-muted px-2 text-sm">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefForPage(p)}
            prefetch={false}
            aria-current={p === page ? "page" : undefined}
            className={
              "rounded-md px-3 py-2 text-sm tabular-nums " +
              (p === page
                ? "bg-brand-primary text-brand-on-primary font-semibold"
                : "text-text hover:bg-surface-muted")
            }
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={hrefForPage(page + 1)}
          prefetch={false}
          className="text-text hover:bg-surface-muted rounded-md px-3 py-2 text-sm"
        >
          Sljedeća →
        </Link>
      )}
    </nav>
  );
}

function pageWindow(current: number, total: number): Array<number | "..."> {
  // 1 2 3 4 5  if total ≤ 5
  // 1 ... (c-1) c (c+1) ... total  otherwise
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: Array<number | "..."> = [1];
  if (current > 3) out.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) out.push(p);
  if (current < total - 2) out.push("...");
  out.push(total);
  return out;
}
