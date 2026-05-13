import Link from "next/link";
import {
  filterToQueryString,
  SORT_OPTIONS,
  type UsedCarFilter,
  type UsedCarSort,
} from "@/lib/used-cars/filter";

/**
 * Zero-JS sort selector — renders each sort mode as a pill <Link>. Picks a
 * sort while keeping the filter and resetting the page back to 1 (changing
 * the order while staying on page 5 of the old order is rarely what the
 * user means).
 */

type Props = {
  filter: UsedCarFilter;
};

function hrefForSort(filter: UsedCarFilter, sort: UsedCarSort): string {
  const qs = filterToQueryString({ ...filter, sort, page: 1 });
  return qs ? `/rabljena-vozila?${qs}` : "/rabljena-vozila";
}

export default function SortDropdown({ filter }: Props) {
  return (
    <nav aria-label="Redoslijed" className="flex flex-wrap gap-2">
      <span className="text-text-muted self-center text-sm">Sortiraj:</span>
      {SORT_OPTIONS.map((option) => {
        const isActive = option.value === filter.sort;
        return (
          <Link
            key={option.value}
            href={hrefForSort(filter, option.value)}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "bg-brand-accent text-brand-primary rounded-full px-3 py-1 text-sm font-medium"
                : "border-surface-border text-text-muted hover:text-text rounded-full border px-3 py-1 text-sm"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
