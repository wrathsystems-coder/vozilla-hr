import "server-only";

import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Brand, BodyType, Model, ModelVersion } from "@/payload-types";
import { getDb } from "@/lib/db/client";
import {
  CATALOG_PAGE_SIZE,
  type CatalogSort,
  type NumericRange,
  type VehicleFilter,
  filterToQueryString,
} from "./filter";

/**
 * Filtered model_versions fetcher for /nova-vozila/ listings page.
 *
 * The filter type carries 17 multi-select + 15 range dims; this module
 * translates them into a Payload `where` clause and runs the query
 * against the Payload local API. Result wrapped in `unstable_cache`
 * keyed by the canonical filter query string so revalidateTag on
 * `model_versions` invalidates the entire keyspace at once.
 *
 * Slug-based filters (brand/model/body type) resolve to numeric IDs
 * first. A miss on a required slug returns zero results (not silently
 * ignored) — `?marka=nonexistent` shows 0 hits, not the full catalogue.
 */

const ONE_HOUR = 3600;

export type ModelVersionListItem = {
  id: number;
  versionName: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  bodyTypeSlug: string | null;
  bodyTypeName: string | null;
  year: number | null;
  priceEur: number | null;
  powerHp: number | null;
  powerKw: number | null;
  torqueNm: number | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  ecoNorm: string | null;
  evRangeKm: number | null;
  acceleration: number | null;
  maxSpeed: number | null;
  consumption: number | null;
};

export type ListResult = {
  items: ModelVersionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const SORT_TO_PAYLOAD: Record<CatalogSort, string> = {
  newest: "-createdAt",
  cheapest: "price_eur",
  priciest: "-price_eur",
  mostPower: "-power_hp",
};

type ModelWithRefs = Model & { brand: Brand; body_type: BodyType | null };

function isPopulated<T extends { id: number }>(v: number | T | null | undefined): v is T {
  return typeof v === "object" && v !== null;
}

async function payload() {
  return getPayload({ config });
}

// --- Slug → id resolvers ---

async function resolveBrandIds(slugs: string[]): Promise<number[]> {
  if (!slugs.length) return [];
  const p = await payload();
  const r = await p.find({
    collection: "brands",
    where: { slug: { in: slugs } },
    limit: slugs.length,
    depth: 0,
  });
  return (r.docs as Brand[]).map((b) => b.id as number);
}

async function resolveModelIds(slugs: string[], brandIds: number[]): Promise<number[]> {
  if (!slugs.length) return [];
  const p = await payload();
  const where: Where = { slug: { in: slugs } };
  if (brandIds.length) where.brand = { in: brandIds };
  const r = await p.find({ collection: "models", where, limit: slugs.length, depth: 0 });
  return (r.docs as Model[]).map((m) => m.id as number);
}

async function resolveBodyTypeIds(slugs: string[]): Promise<number[]> {
  if (!slugs.length) return [];
  const p = await payload();
  const r = await p.find({
    collection: "body_types",
    where: { slug: { in: slugs } },
    limit: slugs.length,
    depth: 0,
  });
  return (r.docs as BodyType[]).map((b) => b.id as number);
}

// --- Drizzle raw helpers for m2m hasMany filter resolution ---
// The m2m tables follow Payload's naming convention:
// `{collection}_{field}` with columns (id, parent_id, value, order).

async function idsHavingAllValues(table: string, values: string[]): Promise<Set<number>> {
  // "Row has ALL of values" — group by parent_id, having count(distinct
  // value) = N. Works with composite enum types because we cast to text
  // for the value comparison.
  //
  // `sql.join` builds a parameterised IN clause — drizzle's bare `${arr}`
  // serialises as a single text param, not a Postgres array, so `ANY(...)`
  // errors with "requires array on right side" (42809).
  if (values.length === 0) return new Set();
  const db = getDb();
  const valueList = sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  );
  const result = await db.execute<{ parent_id: number }>(sql`
    SELECT parent_id
    FROM ${sql.identifier(table)}
    WHERE value::text IN (${valueList})
    GROUP BY parent_id
    HAVING COUNT(DISTINCT value::text) = ${values.length}
  `);
  return new Set(result.map((r) => r.parent_id));
}

async function idsHavingAnyValue(table: string, values: string[]): Promise<Set<number>> {
  if (values.length === 0) return new Set();
  const db = getDb();
  const valueList = sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  );
  const result = await db.execute<{ parent_id: number }>(sql`
    SELECT DISTINCT parent_id
    FROM ${sql.identifier(table)}
    WHERE value::text IN (${valueList})
  `);
  return new Set(result.map((r) => r.parent_id));
}

function intersect(prev: Set<number> | null, next: Set<number>): Set<number> {
  if (prev === null) return next;
  const out = new Set<number>();
  for (const id of next) if (prev.has(id)) out.add(id);
  return out;
}

// --- Filter → Payload where translator ---

function rangeWhere(
  r: NumericRange,
): { greater_than_equal?: number; less_than_equal?: number } | undefined {
  const out: { greater_than_equal?: number; less_than_equal?: number } = {};
  if (r.min != null) out.greater_than_equal = r.min;
  if (r.max != null) out.less_than_equal = r.max;
  return Object.keys(out).length ? out : undefined;
}

type BuildWhereOpts = {
  /** Skip this dim — used by facet count queries (apply all filters except this one). */
  exclude?: keyof VehicleFilter;
};

async function buildModelVersionsWhere(
  filter: VehicleFilter,
  opts: BuildWhereOpts = {},
): Promise<Where | null> {
  const and: Where[] = [];

  // --- Multi-select string dims (resolved via Model join) ---
  // Brand/Model/BodyType filters go via the parent Model relation.
  // We do an explicit pre-resolve pass so a missing slug → empty result
  // rather than silently dropping the filter.
  const wantBrand = opts.exclude !== "brands" && filter.brands.length > 0;
  const wantModel = opts.exclude !== "models" && filter.models.length > 0;
  const wantBodyType = opts.exclude !== "bodyTypes" && filter.bodyTypes.length > 0;

  let brandIds: number[] = [];
  if (wantBrand) {
    brandIds = await resolveBrandIds(filter.brands);
    if (brandIds.length === 0) return null; // unknown brand slug → 0 results
  }
  let modelIds: number[] = [];
  if (wantModel) {
    modelIds = await resolveModelIds(filter.models, brandIds);
    if (modelIds.length === 0) return null;
  }
  let bodyTypeIds: number[] = [];
  if (wantBodyType) {
    bodyTypeIds = await resolveBodyTypeIds(filter.bodyTypes);
    if (bodyTypeIds.length === 0) return null;
  }

  if (modelIds.length) {
    and.push({ model: { in: modelIds } });
  } else if (brandIds.length) {
    and.push({ "model.brand": { in: brandIds } });
  }
  if (bodyTypeIds.length) {
    and.push({ "model.body_type": { in: bodyTypeIds } });
  }

  // --- Multi-select dims on model_versions directly ---
  if (opts.exclude !== "fuels" && filter.fuels.length) {
    and.push({ engine_type: { in: filter.fuels } });
  }
  if (opts.exclude !== "transmissions" && filter.transmissions.length) {
    and.push({ transmission: { in: filter.transmissions } });
  }
  if (opts.exclude !== "drivetrains" && filter.drivetrains.length) {
    and.push({ drivetrain: { in: filter.drivetrains } });
  }
  if (opts.exclude !== "engineConfigs" && filter.engineConfigs.length) {
    and.push({ engine_config: { in: filter.engineConfigs } });
  }
  if (opts.exclude !== "ecoNorms" && filter.ecoNorms.length) {
    and.push({ eco_norm: { in: filter.ecoNorms } });
  }
  if (opts.exclude !== "segments" && filter.segments.length) {
    and.push({ "model.segment": { in: filter.segments } });
  }

  // Multi-select hasMany array dims — Payload's `where` engine doesn't
  // reliably join through the m2m enum tables when you nest where-clauses
  // (we got 0 hits even with `equals` / `contains` operators). Workaround:
  // pre-resolve to a set of model_version IDs via raw SQL against the
  // m2m tables, then pass `id: { in: [...] }` to Payload — flat IDs are
  // unambiguous.
  //
  // equipment uses AND-between-values (must have ALL selected items),
  // seat/steering materials + colors use OR-within-group (any of selected).
  // Intersect across dims by passing through `idCandidates` if multiple
  // hasMany filters are active.
  let idCandidates: Set<number> | null = null;

  if (opts.exclude !== "equipment" && filter.equipment.length) {
    const ids = await idsHavingAllValues("model_versions_equipment", filter.equipment);
    idCandidates = intersect(idCandidates, ids);
    if (idCandidates.size === 0) return null;
  }
  if (opts.exclude !== "seatMaterials" && filter.seatMaterials.length) {
    const ids = await idsHavingAnyValue("model_versions_seat_materials", filter.seatMaterials);
    idCandidates = intersect(idCandidates, ids);
    if (idCandidates.size === 0) return null;
  }
  if (opts.exclude !== "steeringMaterials" && filter.steeringMaterials.length) {
    const ids = await idsHavingAnyValue(
      "model_versions_steering_materials",
      filter.steeringMaterials,
    );
    idCandidates = intersect(idCandidates, ids);
    if (idCandidates.size === 0) return null;
  }
  if (opts.exclude !== "colors" && filter.colors.length) {
    const ids = await idsHavingAnyValue("model_versions_colors_available", filter.colors);
    idCandidates = intersect(idCandidates, ids);
    if (idCandidates.size === 0) return null;
  }
  if (idCandidates !== null) {
    and.push({ id: { in: [...idCandidates] } });
  }

  // Multi-select small-int dims
  if (opts.exclude !== "seatsCounts" && filter.seatsCounts.length) {
    and.push({ seats_count: { in: filter.seatsCounts } });
  }
  if (opts.exclude !== "doorsCounts" && filter.doorsCounts.length) {
    and.push({ doors_count: { in: filter.doorsCounts } });
  }
  if (opts.exclude !== "climateZones" && filter.climateZones.length) {
    and.push({ climate_zones: { in: filter.climateZones } });
  }
  if (opts.exclude !== "ncapStars" && filter.ncapStars.length) {
    and.push({ euro_ncap_stars: { in: filter.ncapStars } });
  }

  // --- Range dims ---
  const RANGE_BINDINGS: Array<[keyof VehicleFilter, string]> = [
    ["price", "price_eur"],
    ["year", "year"],
    ["powerHp", "power_hp"],
    ["torqueNm", "torque_nm"],
    ["maxSpeedKmh", "max_speed_kmh"],
    ["bootCapacityL", "boot_capacity_l"],
    ["loadCapacityKg", "load_capacity_kg"],
    ["weightKg", "weight_kg"],
    ["acceleration", "acceleration_0_100_s"],
    ["consumption", "fuel_consumption_combined_l"],
    ["co2", "co2_emission_g_km"],
    ["evRange", "ev_range_km"],
    ["screenInches", "infotainment_screen_in"],
    ["usbPorts", "usb_ports"],
    ["airbags", "airbags_count"],
  ];
  for (const [filterKey, column] of RANGE_BINDINGS) {
    if (opts.exclude === filterKey) continue;
    const range = filter[filterKey] as NumericRange;
    const clause = rangeWhere(range);
    if (clause) and.push({ [column]: clause });
  }

  // Default: only show current/active versions in catalog listings.
  and.push({ is_current: { equals: true } });

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { and };
}

// --- Public list fetcher ---

async function fetchListUncached(filter: VehicleFilter): Promise<ListResult> {
  const where = await buildModelVersionsWhere(filter);
  if (where == null) {
    return emptyListResult(filter.page);
  }

  const p = await payload();
  const r = await p.find({
    collection: "model_versions",
    where,
    sort: SORT_TO_PAYLOAD[filter.sort],
    limit: CATALOG_PAGE_SIZE,
    page: filter.page,
    depth: 2, // populate model + brand + body_type
  });

  const items: ModelVersionListItem[] = (r.docs as ModelVersion[]).map((v) => {
    const model = isPopulated(v.model) ? (v.model as ModelWithRefs) : null;
    const brand = model && isPopulated(model.brand) ? model.brand : null;
    const bodyType = model && isPopulated(model.body_type) ? model.body_type : null;
    return {
      id: v.id as number,
      versionName: v.name,
      modelName: model?.name ?? "—",
      modelSlug: model?.slug ?? "",
      brandName: brand?.name ?? "—",
      brandSlug: brand?.slug ?? "",
      bodyTypeName: bodyType?.name ?? null,
      bodyTypeSlug: bodyType?.slug ?? null,
      year: v.year ?? null,
      priceEur: v.price_eur ?? null,
      powerHp: v.power_hp ?? null,
      powerKw: v.power_kw ?? null,
      torqueNm: v.torque_nm ?? null,
      fuelType: v.engine_type ?? null,
      transmission: v.transmission ?? null,
      drivetrain: v.drivetrain ?? null,
      ecoNorm: v.eco_norm ?? null,
      evRangeKm: v.ev_range_km ?? null,
      acceleration: v.acceleration_0_100_s ?? null,
      maxSpeed: v.max_speed_kmh ?? null,
      consumption: v.fuel_consumption_combined_l ?? null,
    };
  });

  return {
    items,
    total: r.totalDocs,
    page: r.page ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
    totalPages: r.totalPages ?? 1,
  };
}

function emptyListResult(page: number): ListResult {
  return { items: [], total: 0, page, pageSize: CATALOG_PAGE_SIZE, totalPages: 0 };
}

export async function fetchModelVersionsList(filter: VehicleFilter): Promise<ListResult> {
  // Key the cache by the canonical filter URL. revalidateTag('model_versions')
  // already wired in Sprint 7 collection hooks → invalidates instantly.
  const cacheKey = filterToQueryString(filter) || "all";
  return unstable_cache(() => fetchListUncached(filter), [`catalog:list:${cacheKey}`], {
    tags: ["model_versions", "models", "brands"],
    revalidate: ONE_HOUR,
  })();
}

// --- Helpers exported for facets module ---

export { buildModelVersionsWhere };
