import Link from "next/link";
import { filterToQueryString, SORT_OPTIONS, type VehicleFilter } from "@/lib/catalog/filter";

/**
 * Sort + result count bar above the listings grid. Server-rendered as
 * pill links — each click changes only the `sort` param while keeping
 * filter state intact. No JS dependency for sort UX.
 */

type Props = {
  filter: VehicleFilter;
  total: number;
  action: string;
};

export default function CatalogSortBar({ filter, total, action }: Props) {
  return (
    <div className="bg-surface border-surface-border flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="text-text text-sm">
        <span className="font-semibold tabular-nums">{total}</span>{" "}
        <span className="text-text-muted">{total === 1 ? "rezultat" : "rezultata"}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-text-muted text-xs">Sortiraj:</span>
        {SORT_OPTIONS.map((opt) => {
          const active = filter.sort === opt.value;
          const next: VehicleFilter = { ...filter, sort: opt.value, page: 1 };
          const qs = filterToQueryString(next);
          const href = qs ? `${action}?${qs}` : action;
          return (
            <Link
              key={opt.value}
              href={href}
              prefetch={false}
              aria-current={active ? "true" : undefined}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (active
                  ? "bg-brand-primary text-brand-on-primary"
                  : "bg-surface-muted text-text hover:bg-surface-border")
              }
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
