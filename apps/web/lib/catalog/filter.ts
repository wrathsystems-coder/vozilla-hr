// Generic /nova-vozila/ filter parser + serialiser. Built per the URL
// spec in `docs/filter-architecture.md`:
//
//   - Multi-select dims use comma-separated values within one param key:
//     `?marka=audi,bmw&gorivo=diesel,hybrid` (OR within group, AND between)
//   - Range dims use `_od` / `_do` param pairs:
//     `?cijena_od=20000&cijena_do=40000`
//   - Default values (sort=newest, p=1) omitted from output to keep
//     bookmarkable URLs canonical
//   - Parser is tolerant: unknown keys ignored, malformed numbers
//     dropped silently (URL trust boundary)
//
// Mirrors the shape of `lib/used-cars/filter.ts` but generalised for
// multi-select. The two listings (/nova-vozila/ and /rabljena-vozila/)
// will share this once used-cars also goes multi-select.

export const CATALOG_PAGE_SIZE = 25;

export type CatalogSort = "newest" | "cheapest" | "priciest" | "mostPower";

export const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Najnoviji" },
  { value: "cheapest", label: "Najjeftiniji" },
  { value: "priciest", label: "Najskuplji" },
  { value: "mostPower", label: "Najjači" },
];

const SORT_VALUES = new Set<CatalogSort>(["newest", "cheapest", "priciest", "mostPower"]);

/**
 * VehicleFilter — typed shape of `/nova-vozila/?...` query state.
 *
 * All multi-select fields are `string[]` (empty = no constraint). All
 * range fields are `{ min?, max? }` (both undefined = no constraint).
 *
 * Field naming uses Croatian for URL param keys (so users + bookmarks
 * stay readable) but the type field names use English convention.
 */
export type VehicleFilter = {
  // Multi-select string dims (URL: comma-separated)
  brands: string[]; // marka
  models: string[]; // model (slug)
  bodyTypes: string[]; // kategorija
  fuels: string[]; // gorivo
  transmissions: string[]; // mjenjac
  drivetrains: string[]; // pogon
  segments: string[]; // segment (A/B/C/D/E/F/J/M/S)
  colors: string[]; // boja
  engineConfigs: string[]; // motor_konfig
  ecoNorms: string[]; // eko_norma
  equipment: string[]; // oprema — AND-between-values exception (multi-AND, not multi-OR)
  seatMaterials: string[]; // sjedala_materijal
  steeringMaterials: string[]; // volan_materijal
  // Multi-select numeric (small distinct sets — treated as multi-select chips)
  seatsCounts: number[]; // sjedala (2/4/5/7)
  doorsCounts: number[]; // vrata (3/4/5)
  climateZones: number[]; // klima_zone (1/2/3/4)
  ncapStars: number[]; // ncap (1..5)

  // Range dims (min + max, both optional)
  price: NumericRange; // cijena_od / cijena_do
  year: NumericRange; // godina_od / godina_do
  powerHp: NumericRange; // snaga_od / snaga_do
  torqueNm: NumericRange; // moment_od / moment_do
  maxSpeedKmh: NumericRange; // brzina_od / brzina_do
  bootCapacityL: NumericRange; // prtljaznik_od / prtljaznik_do
  loadCapacityKg: NumericRange; // nosivost_od / nosivost_do
  weightKg: NumericRange; // tezina_od / tezina_do
  acceleration: NumericRange; // ubrzanje_od / ubrzanje_do
  consumption: NumericRange; // potrosnja_od / potrosnja_do
  co2: NumericRange; // co2_od / co2_do
  evRange: NumericRange; // ev_doseg_od / ev_doseg_do
  screenInches: NumericRange; // ekran_od / ekran_do
  usbPorts: NumericRange; // usb_od / usb_do
  airbags: NumericRange; // jastuci_od / jastuci_do

  sort: CatalogSort;
  page: number;
};

export type NumericRange = { min?: number; max?: number };

// --- Parser ---

function pickAll(value: string | string[] | undefined): string[] {
  // Next.js may give us either form. We accept both `?k=a,b` (one entry
  // with comma) and `?k=a&k=b` (two entries) — both yield `[a, b]`.
  if (value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .flatMap((v) => v.split(","))
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

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

function parseNonNegativeFloat(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function parseRange(
  searchParams: Record<string, string | string[] | undefined>,
  paramBase: string,
  parser: (v: string | undefined) => number | undefined = parseNonNegativeInt,
): NumericRange {
  const min = parser(pickFirst(searchParams[`${paramBase}_od`]));
  const max = parser(pickFirst(searchParams[`${paramBase}_do`]));
  return { min, max };
}

function parseIntArray(value: string | string[] | undefined): number[] {
  return pickAll(value)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

export function parseFilter(
  searchParams: Record<string, string | string[] | undefined>,
): VehicleFilter {
  const sortRaw = pickFirst(searchParams.sort);
  const sort: CatalogSort = SORT_VALUES.has(sortRaw as CatalogSort)
    ? (sortRaw as CatalogSort)
    : "newest";

  const pageRaw = parseNonNegativeInt(pickFirst(searchParams.p));
  const page = pageRaw && pageRaw > 0 ? pageRaw : 1;

  return {
    brands: pickAll(searchParams.marka),
    models: pickAll(searchParams.model),
    bodyTypes: pickAll(searchParams.kategorija),
    fuels: pickAll(searchParams.gorivo),
    transmissions: pickAll(searchParams.mjenjac),
    drivetrains: pickAll(searchParams.pogon),
    segments: pickAll(searchParams.segment),
    colors: pickAll(searchParams.boja),
    engineConfigs: pickAll(searchParams.motor_konfig),
    ecoNorms: pickAll(searchParams.eko_norma),
    equipment: pickAll(searchParams.oprema),
    seatMaterials: pickAll(searchParams.sjedala_materijal),
    steeringMaterials: pickAll(searchParams.volan_materijal),
    seatsCounts: parseIntArray(searchParams.sjedala),
    doorsCounts: parseIntArray(searchParams.vrata),
    climateZones: parseIntArray(searchParams.klima_zone),
    ncapStars: parseIntArray(searchParams.ncap),

    price: parseRange(searchParams, "cijena"),
    year: parseRange(searchParams, "godina"),
    powerHp: parseRange(searchParams, "snaga"),
    torqueNm: parseRange(searchParams, "moment"),
    maxSpeedKmh: parseRange(searchParams, "brzina"),
    bootCapacityL: parseRange(searchParams, "prtljaznik"),
    loadCapacityKg: parseRange(searchParams, "nosivost"),
    weightKg: parseRange(searchParams, "tezina"),
    acceleration: parseRange(searchParams, "ubrzanje", parseNonNegativeFloat),
    consumption: parseRange(searchParams, "potrosnja", parseNonNegativeFloat),
    co2: parseRange(searchParams, "co2"),
    evRange: parseRange(searchParams, "ev_doseg"),
    screenInches: parseRange(searchParams, "ekran", parseNonNegativeFloat),
    usbPorts: parseRange(searchParams, "usb"),
    airbags: parseRange(searchParams, "jastuci"),

    sort,
    page,
  };
}

// --- Serialiser ---

function setMulti(params: URLSearchParams, key: string, values: string[] | number[]) {
  if (!values.length) return;
  params.set(key, values.join(","));
}

function setRange(params: URLSearchParams, base: string, range: NumericRange) {
  if (range.min != null) params.set(`${base}_od`, String(range.min));
  if (range.max != null) params.set(`${base}_do`, String(range.max));
}

export function filterToQueryString(filter: VehicleFilter): string {
  const params = new URLSearchParams();
  setMulti(params, "marka", filter.brands);
  setMulti(params, "model", filter.models);
  setMulti(params, "kategorija", filter.bodyTypes);
  setMulti(params, "gorivo", filter.fuels);
  setMulti(params, "mjenjac", filter.transmissions);
  setMulti(params, "pogon", filter.drivetrains);
  setMulti(params, "segment", filter.segments);
  setMulti(params, "boja", filter.colors);
  setMulti(params, "motor_konfig", filter.engineConfigs);
  setMulti(params, "eko_norma", filter.ecoNorms);
  setMulti(params, "oprema", filter.equipment);
  setMulti(params, "sjedala_materijal", filter.seatMaterials);
  setMulti(params, "volan_materijal", filter.steeringMaterials);
  setMulti(params, "sjedala", filter.seatsCounts);
  setMulti(params, "vrata", filter.doorsCounts);
  setMulti(params, "klima_zone", filter.climateZones);
  setMulti(params, "ncap", filter.ncapStars);
  setRange(params, "cijena", filter.price);
  setRange(params, "godina", filter.year);
  setRange(params, "snaga", filter.powerHp);
  setRange(params, "moment", filter.torqueNm);
  setRange(params, "brzina", filter.maxSpeedKmh);
  setRange(params, "prtljaznik", filter.bootCapacityL);
  setRange(params, "nosivost", filter.loadCapacityKg);
  setRange(params, "tezina", filter.weightKg);
  setRange(params, "ubrzanje", filter.acceleration);
  setRange(params, "potrosnja", filter.consumption);
  setRange(params, "co2", filter.co2);
  setRange(params, "ev_doseg", filter.evRange);
  setRange(params, "ekran", filter.screenInches);
  setRange(params, "usb", filter.usbPorts);
  setRange(params, "jastuci", filter.airbags);
  if (filter.sort && filter.sort !== "newest") params.set("sort", filter.sort);
  if (filter.page && filter.page > 1) params.set("p", String(filter.page));
  return params.toString();
}

export function emptyFilter(): VehicleFilter {
  return {
    brands: [],
    models: [],
    bodyTypes: [],
    fuels: [],
    transmissions: [],
    drivetrains: [],
    segments: [],
    colors: [],
    engineConfigs: [],
    ecoNorms: [],
    equipment: [],
    seatMaterials: [],
    steeringMaterials: [],
    seatsCounts: [],
    doorsCounts: [],
    climateZones: [],
    ncapStars: [],
    price: {},
    year: {},
    powerHp: {},
    torqueNm: {},
    maxSpeedKmh: {},
    bootCapacityL: {},
    loadCapacityKg: {},
    weightKg: {},
    acceleration: {},
    consumption: {},
    co2: {},
    evRange: {},
    screenInches: {},
    usbPorts: {},
    airbags: {},
    sort: "newest",
    page: 1,
  };
}

export function isFilterEmpty(filter: VehicleFilter): boolean {
  return (
    filter.brands.length === 0 &&
    filter.models.length === 0 &&
    filter.bodyTypes.length === 0 &&
    filter.fuels.length === 0 &&
    filter.transmissions.length === 0 &&
    filter.drivetrains.length === 0 &&
    filter.segments.length === 0 &&
    filter.colors.length === 0 &&
    filter.engineConfigs.length === 0 &&
    filter.ecoNorms.length === 0 &&
    filter.equipment.length === 0 &&
    filter.seatMaterials.length === 0 &&
    filter.steeringMaterials.length === 0 &&
    filter.seatsCounts.length === 0 &&
    filter.doorsCounts.length === 0 &&
    filter.climateZones.length === 0 &&
    filter.ncapStars.length === 0 &&
    isRangeEmpty(filter.price) &&
    isRangeEmpty(filter.year) &&
    isRangeEmpty(filter.powerHp) &&
    isRangeEmpty(filter.torqueNm) &&
    isRangeEmpty(filter.maxSpeedKmh) &&
    isRangeEmpty(filter.bootCapacityL) &&
    isRangeEmpty(filter.loadCapacityKg) &&
    isRangeEmpty(filter.weightKg) &&
    isRangeEmpty(filter.acceleration) &&
    isRangeEmpty(filter.consumption) &&
    isRangeEmpty(filter.co2) &&
    isRangeEmpty(filter.evRange) &&
    isRangeEmpty(filter.screenInches) &&
    isRangeEmpty(filter.usbPorts) &&
    isRangeEmpty(filter.airbags)
  );
}

export function isRangeEmpty(r: NumericRange): boolean {
  return r.min == null && r.max == null;
}

/**
 * Returns true if user has applied any filter at all (sort/page changes
 * don't count). Used by the listing page to decide between hub render
 * (no filter applied → show brands/categories discovery) and listings
 * render (any filter applied → show filtered model_versions grid).
 */
export function hasAnyFilter(filter: VehicleFilter): boolean {
  return !isFilterEmpty(filter);
}

/**
 * Returns a new filter with one multi-select value removed (used by the
 * "X" button on active filter chips). Returns the same filter object
 * (referentially) if the value wasn't present.
 */
export function removeMultiValue<K extends keyof VehicleFilter>(
  filter: VehicleFilter,
  key: K,
  value: string | number,
): VehicleFilter {
  const current = filter[key];
  if (!Array.isArray(current)) return filter;
  const next = (current as Array<string | number>).filter((v) => v !== value);
  if (next.length === current.length) return filter;
  return { ...filter, [key]: next, page: 1 };
}

/**
 * Returns a new filter with one range cleared.
 */
export function clearRange<K extends keyof VehicleFilter>(
  filter: VehicleFilter,
  key: K,
): VehicleFilter {
  if (typeof filter[key] !== "object" || filter[key] == null || Array.isArray(filter[key])) {
    return filter;
  }
  return { ...filter, [key]: {}, page: 1 };
}
