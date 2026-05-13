// URL search-param helpers for /rabljena-vozila/ listings.
//
// Filter shape is single-valued per dimension in MVP. Spec calls for
// multi-select on brand and fuel; we ship single-select first because the
// catalogue starts small (2 brands seeded) and `?marka=audi&marka=skoda`
// adds parser complexity that pays off only once we have 20+ brands. The
// filter type uses bare strings so the upgrade to `string[]` only needs to
// change parsing + the SQL where clause — call sites are stable.

export const USED_CAR_PAGE_SIZE = 25;

export type UsedCarSort = "newest" | "cheapest" | "leastKm";

export const SORT_OPTIONS: { value: UsedCarSort; label: string }[] = [
  { value: "newest", label: "Najnoviji" },
  { value: "cheapest", label: "Najjeftiniji" },
  { value: "leastKm", label: "Najmanje km" },
];

export type UsedCarFilter = {
  brandSlug?: string;
  modelSlug?: string;
  bodyTypeSlug?: string;
  fuel?: string;
  transmission?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMin?: number;
  kmMax?: number;
  countyId?: number;
  sort: UsedCarSort;
  page: number;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseNonNegativeInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

const SORT_VALUES = new Set<UsedCarSort>(["newest", "cheapest", "leastKm"]);

export function parseFilter(
  searchParams: Record<string, string | string[] | undefined>,
): UsedCarFilter {
  const get = (k: string): string | undefined => pickFirst(searchParams[k]);

  const sortRaw = get("sort");
  const sort: UsedCarSort = SORT_VALUES.has(sortRaw as UsedCarSort)
    ? (sortRaw as UsedCarSort)
    : "newest";

  const pageRaw = parseNonNegativeInt(get("p"));
  const page = pageRaw && pageRaw > 0 ? pageRaw : 1;

  return {
    brandSlug: get("marka") || undefined,
    modelSlug: get("model") || undefined,
    bodyTypeSlug: get("kategorija") || undefined,
    fuel: get("pogon") || undefined,
    transmission: get("mjenjac") || undefined,
    priceMin: parseNonNegativeInt(get("cijena_od")),
    priceMax: parseNonNegativeInt(get("cijena_do")),
    yearMin: parseNonNegativeInt(get("godina_od")),
    yearMax: parseNonNegativeInt(get("godina_do")),
    kmMin: parseNonNegativeInt(get("km_od")),
    kmMax: parseNonNegativeInt(get("km_do")),
    countyId: parseNonNegativeInt(get("zupanija")),
    sort,
    page,
  };
}

export function filterToQueryString(filter: Partial<UsedCarFilter>): string {
  const params = new URLSearchParams();
  if (filter.brandSlug) params.set("marka", filter.brandSlug);
  if (filter.modelSlug) params.set("model", filter.modelSlug);
  if (filter.bodyTypeSlug) params.set("kategorija", filter.bodyTypeSlug);
  if (filter.fuel) params.set("pogon", filter.fuel);
  if (filter.transmission) params.set("mjenjac", filter.transmission);
  if (filter.priceMin != null) params.set("cijena_od", String(filter.priceMin));
  if (filter.priceMax != null) params.set("cijena_do", String(filter.priceMax));
  if (filter.yearMin != null) params.set("godina_od", String(filter.yearMin));
  if (filter.yearMax != null) params.set("godina_do", String(filter.yearMax));
  if (filter.kmMin != null) params.set("km_od", String(filter.kmMin));
  if (filter.kmMax != null) params.set("km_do", String(filter.kmMax));
  if (filter.countyId != null) params.set("zupanija", String(filter.countyId));
  // Keep the URL clean: omit default sort + default page.
  if (filter.sort && filter.sort !== "newest") params.set("sort", filter.sort);
  if (filter.page && filter.page > 1) params.set("p", String(filter.page));
  return params.toString();
}

export function isFilterEmpty(filter: UsedCarFilter): boolean {
  return !(
    filter.brandSlug ||
    filter.modelSlug ||
    filter.bodyTypeSlug ||
    filter.fuel ||
    filter.transmission ||
    filter.priceMin != null ||
    filter.priceMax != null ||
    filter.yearMin != null ||
    filter.yearMax != null ||
    filter.kmMin != null ||
    filter.kmMax != null ||
    filter.countyId != null
  );
}
