import "server-only";

import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Brand, BodyType } from "@/payload-types";
import { sortHr } from "@/lib/utils/sort";
import { getDb } from "@/lib/db/client";
import { filterToQueryString, type VehicleFilter } from "./filter";
import { buildModelVersionsWhere } from "./filter-fetch";

/**
 * Facet count helper for /nova-vozila/ filter sidebar.
 *
 * Strategy (per filter-architecture.md): for each facet dim, run a
 * count query with all filters applied EXCEPT the one for that dim.
 * This lets the UI show "Audi (1243)" where 1243 is the count under
 * the user's other filters — answering "if I changed brand, how many
 * matches would I have?"
 *
 * MVP implementation runs N+1 queries (one per facet, plus the total).
 * CTE-base optimisation deferred until benchmarks show it's needed —
 * Postgres count(*) on 20k rows with indexes is <100ms; per
 * filter-architecture.md "Materialised view defer until benchmark
 * pokaže problem".
 *
 * Result cached `unstable_cache` keyed by the canonical filter URL
 * and tagged `model_versions` — Payload afterChange hooks already
 * wired to invalidate.
 */

const ONE_HOUR = 3600;

export type FacetBucket<T extends string | number = string> = {
  value: T;
  label: string;
  count: number;
};

export type FacetResult = {
  brands: FacetBucket[];
  bodyTypes: FacetBucket[];
  fuels: FacetBucket[];
  transmissions: FacetBucket[];
  drivetrains: FacetBucket[];
  engineConfigs: FacetBucket[];
  ecoNorms: FacetBucket[];
  segments: FacetBucket[];
  seatsCounts: FacetBucket<number>[];
  doorsCounts: FacetBucket<number>[];
  climateZones: FacetBucket<number>[];
  ncapStars: FacetBucket<number>[];
  equipment: FacetBucket[];
  seatMaterials: FacetBucket[];
  steeringMaterials: FacetBucket[];
  colors: FacetBucket[];
  /** Total matching current filter (no exclusion). */
  total: number;
};

// --- Label tables — Croatian display labels for enum values ---
// Source of truth is the Payload field options; this table is a flat
// mirror so we don't have to introspect Payload schema at query time.

// Must match the Payload `engine_type` select options exactly — Postgres
// rejects unknown enum values at query time (22P02). LPG/CNG appear in
// the mapping FUEL_VALUE_MAP for future-proofing but the schema enum
// doesn't carry them yet; add to the enum + this label table together
// when needed.
const FUEL_LABELS: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  phev: "Plug-in hibrid",
  ev: "Električni",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manualni",
  automatic: "Automatski",
  dct: "DCT",
  cvt: "CVT",
};

const DRIVETRAIN_LABELS: Record<string, string> = {
  fwd: "Prednji (FWD)",
  rwd: "Stražnji (RWD)",
  awd: "AWD",
  "4x4": "4x4",
};

const ENGINE_CONFIG_LABELS: Record<string, string> = {
  inline_3: "Inline-3",
  inline_4: "Inline-4",
  inline_5: "Inline-5",
  inline_6: "Inline-6",
  v6: "V6",
  v8: "V8",
  v10: "V10",
  v12: "V12",
  boxer_4: "Boxer-4",
  boxer_6: "Boxer-6",
  rotary: "Rotacijski",
  electric_motor: "Elektromotor",
  hybrid_motor: "Hibridni",
  other: "Ostalo",
};

const ECO_NORM_LABELS: Record<string, string> = {
  euro_4: "EURO 4",
  euro_5: "EURO 5",
  euro_6: "EURO 6",
  euro_6d: "EURO 6d",
  bev: "BEV (0 emisija)",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  panorama: "Panoramski krov",
  hud: "Head-Up Display",
  heated_seats: "Grijana sjedala",
  ventilated_seats: "Ventilirana sjedala",
  massage_seats: "Masažna sjedala",
  memory_seats: "Memorijska sjedala",
  leather_seats: "Kožna sjedala",
  alcantara_seats: "Alcantara sjedala",
  vegan_leather_seats: "Veganska/eko koža",
  electric_seats: "Električna sjedala",
  adaptive_cruise: "Adaptivni tempomat",
  lane_assist: "Lane assist",
  blind_spot: "Blind spot",
  camera_360: "360° kamera",
  rear_camera: "Stražnja kamera",
  parking_sensors: "Parkirni senzori",
  auto_parking: "Auto parking",
  aeb: "AEB",
  led_matrix: "LED matrix",
  led_lights: "LED svjetla",
  night_vision: "Night vision",
  travel_assist: "Travel Assist",
  sport_chrono: "Sport Chrono",
  pasm: "PASM",
  wireless_charging: "Bežično punjenje",
  apple_carplay: "Apple CarPlay",
  android_auto: "Android Auto",
  premium_audio: "Premium audio",
  harman_kardon: "Harman Kardon",
  burmester_audio: "Burmester",
  bose_audio: "Bose",
  touchscreen: "Touchscreen",
  voice_assistant: "Glasovni asistent",
  physical_buttons: "Fizičke tipke",
  rotary_controller: "Rotacijski kontroler",
  touch_sliders: "Touch slideri",
};

const SEAT_MATERIAL_LABELS: Record<string, string> = {
  fabric: "Tkanina",
  leather: "Koža",
  vegan_leather: "Veganska koža",
  alcantara: "Alcantara",
  synthetic_leather: "Sintetička koža",
  microfiber: "Mikrofiber",
};

const STEERING_MATERIAL_LABELS: Record<string, string> = {
  leather: "Koža",
  alcantara: "Alcantara",
  fabric: "Tkanina",
  synthetic_leather: "Sintetička",
  plastic: "Plastika",
};

const COLOR_LABELS: Record<string, string> = {
  white: "Bijela",
  black: "Crna",
  grey: "Siva",
  silver: "Srebrna",
  blue: "Plava",
  red: "Crvena",
  green: "Zelena",
  brown: "Smeđa",
  yellow: "Žuta",
  orange: "Narančasta",
  beige: "Bež",
};

const SEGMENT_LABELS: Record<string, string> = {
  A: "A — Mini",
  B: "B — Small",
  C: "C — Compact",
  D: "D — Medium",
  E: "E — Executive",
  F: "F — Luxury",
  J: "J — SUV",
  M: "M — MPV",
  S: "S — Sport",
};

async function payload() {
  return getPayload({ config });
}

// --- Per-facet count helpers ---
// Each helper takes the current filter, builds where-minus-self, then
// runs a count grouped by the facet value. Payload's `find` returns
// `totalDocs` which we use for the total count; for per-value counts
// we run one count query per value (small N — only as many values as
// the option list has). This is naive but fits MVP scale (20k rows /
// ~12 facet dims = small constant queries, each <100ms with indexes).

async function countFacetEnumScalar(
  filter: VehicleFilter,
  excludeKey: keyof VehicleFilter,
  column: string,
  values: string[],
  labels: Record<string, string>,
): Promise<FacetBucket[]> {
  const baseWhere = await buildModelVersionsWhere(filter, { exclude: excludeKey });
  if (baseWhere === null) return [];

  const p = await payload();
  const results = await Promise.all(
    values.map(async (value) => {
      const where = baseWhere
        ? { and: [baseWhere, { [column]: { equals: value } }] }
        : { [column]: { equals: value } };
      const r = await p.count({ collection: "model_versions", where });
      return { value, label: labels[value] ?? value, count: r.totalDocs ?? 0 };
    }),
  );
  return results.filter((r) => r.count > 0 || filter[excludeKey] !== undefined);
}

async function countFacetIntScalar(
  filter: VehicleFilter,
  excludeKey: keyof VehicleFilter,
  column: string,
  values: number[],
): Promise<FacetBucket<number>[]> {
  const baseWhere = await buildModelVersionsWhere(filter, { exclude: excludeKey });
  if (baseWhere === null) return [];
  const p = await payload();
  const results = await Promise.all(
    values.map(async (value) => {
      const where = baseWhere
        ? { and: [baseWhere, { [column]: { equals: value } }] }
        : { [column]: { equals: value } };
      const r = await p.count({ collection: "model_versions", where });
      return { value, label: String(value), count: r.totalDocs ?? 0 };
    }),
  );
  return results.filter((r) => r.count > 0);
}

async function countFacetArrayValues(
  filter: VehicleFilter,
  excludeKey: keyof VehicleFilter,
  m2mTable: string,
  values: string[],
  labels: Record<string, string>,
): Promise<FacetBucket[]> {
  // hasMany select fields (`equipment`, `colors_available`, etc.) live
  // in {collection}_{field} m2m tables (id, parent_id, value, order).
  // Resolve "rows matching everything-except-this-dim" into a candidate
  // ID set via the parent Payload query, then GROUP BY value on the m2m
  // table restricted to those parents. One pass per dim instead of N.
  const baseWhere = await buildModelVersionsWhere(filter, { exclude: excludeKey });
  if (baseWhere === null) return [];

  const p = await payload();
  // Pull candidate IDs at full page-size to cover the catalog. For 20k+
  // catalogs this could grow — defer optimisation per filter-architecture.md.
  const idResult = await p.find({
    collection: "model_versions",
    where: baseWhere,
    limit: 100_000,
    depth: 0,
    pagination: false,
  });
  const ids = (idResult.docs as Array<{ id: number }>).map((d) => d.id);
  if (ids.length === 0) return [];

  const db = getDb();
  const idList = sql.join(
    ids.map((n) => sql`${n}`),
    sql`, `,
  );
  const valueList = sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  );
  const rows = await db.execute<{ value: string; cnt: number }>(sql`
    SELECT value::text as value, COUNT(DISTINCT parent_id)::int as cnt
    FROM ${sql.identifier(m2mTable)}
    WHERE parent_id IN (${idList})
      AND value::text IN (${valueList})
    GROUP BY value
  `);
  const countByValue = new Map(rows.map((r) => [r.value, r.cnt]));
  return values
    .map((v) => ({ value: v, label: labels[v] ?? v, count: countByValue.get(v) ?? 0 }))
    .filter((r) => r.count > 0);
}

async function countFacetBrands(filter: VehicleFilter): Promise<FacetBucket[]> {
  const baseWhere = await buildModelVersionsWhere(filter, { exclude: "brands" });
  if (baseWhere === null) return [];
  const p = await payload();
  // Pull all active brands; for each, count versions whose model.brand = id.
  const brandsRes = await p.find({
    collection: "brands",
    where: { is_active: { equals: true } },
    limit: 500,
    depth: 0,
  });
  const brands = sortHr(brandsRes.docs as Brand[], "name");
  const results = await Promise.all(
    brands.map(async (b) => {
      const where: Where = baseWhere
        ? { and: [baseWhere, { "model.brand": { equals: b.id } }] }
        : { "model.brand": { equals: b.id } };
      const r = await p.count({ collection: "model_versions", where });
      return { value: b.slug as string, label: b.name, count: r.totalDocs ?? 0 };
    }),
  );
  return results.filter((b) => b.count > 0 || filter.brands.includes(b.value));
}

async function countFacetBodyTypes(filter: VehicleFilter): Promise<FacetBucket[]> {
  const baseWhere = await buildModelVersionsWhere(filter, { exclude: "bodyTypes" });
  if (baseWhere === null) return [];
  const p = await payload();
  const btRes = await p.find({
    collection: "body_types",
    limit: 100,
    sort: "sort_order",
    depth: 0,
  });
  const bts = btRes.docs as BodyType[];
  const results = await Promise.all(
    bts.map(async (bt) => {
      const where: Where = baseWhere
        ? { and: [baseWhere, { "model.body_type": { equals: bt.id } }] }
        : { "model.body_type": { equals: bt.id } };
      const r = await p.count({ collection: "model_versions", where });
      return { value: bt.slug as string, label: bt.name, count: r.totalDocs ?? 0 };
    }),
  );
  return results.filter((b) => b.count > 0 || filter.bodyTypes.includes(b.value));
}

async function countTotal(filter: VehicleFilter): Promise<number> {
  const where = await buildModelVersionsWhere(filter);
  if (where === null) return 0;
  const p = await payload();
  const r = await p.count({ collection: "model_versions", where });
  return r.totalDocs ?? 0;
}

async function fetchFacetsUncached(filter: VehicleFilter): Promise<FacetResult> {
  const [
    brands,
    bodyTypes,
    fuels,
    transmissions,
    drivetrains,
    engineConfigs,
    ecoNorms,
    segments,
    seatsCounts,
    doorsCounts,
    climateZones,
    ncapStars,
    equipment,
    seatMaterials,
    steeringMaterials,
    colors,
    total,
  ] = await Promise.all([
    countFacetBrands(filter),
    countFacetBodyTypes(filter),
    countFacetEnumScalar(filter, "fuels", "engine_type", Object.keys(FUEL_LABELS), FUEL_LABELS),
    countFacetEnumScalar(
      filter,
      "transmissions",
      "transmission",
      Object.keys(TRANSMISSION_LABELS),
      TRANSMISSION_LABELS,
    ),
    countFacetEnumScalar(
      filter,
      "drivetrains",
      "drivetrain",
      Object.keys(DRIVETRAIN_LABELS),
      DRIVETRAIN_LABELS,
    ),
    countFacetEnumScalar(
      filter,
      "engineConfigs",
      "engine_config",
      Object.keys(ENGINE_CONFIG_LABELS),
      ENGINE_CONFIG_LABELS,
    ),
    countFacetEnumScalar(
      filter,
      "ecoNorms",
      "eco_norm",
      Object.keys(ECO_NORM_LABELS),
      ECO_NORM_LABELS,
    ),
    countFacetEnumScalar(
      filter,
      "segments",
      "model.segment",
      Object.keys(SEGMENT_LABELS),
      SEGMENT_LABELS,
    ),
    countFacetIntScalar(filter, "seatsCounts", "seats_count", [2, 4, 5, 6, 7, 8, 9]),
    countFacetIntScalar(filter, "doorsCounts", "doors_count", [2, 3, 4, 5]),
    countFacetIntScalar(filter, "climateZones", "climate_zones", [1, 2, 3, 4]),
    countFacetIntScalar(filter, "ncapStars", "euro_ncap_stars", [3, 4, 5]),
    countFacetArrayValues(
      filter,
      "equipment",
      "model_versions_equipment",
      Object.keys(EQUIPMENT_LABELS),
      EQUIPMENT_LABELS,
    ),
    countFacetArrayValues(
      filter,
      "seatMaterials",
      "model_versions_seat_materials",
      Object.keys(SEAT_MATERIAL_LABELS),
      SEAT_MATERIAL_LABELS,
    ),
    countFacetArrayValues(
      filter,
      "steeringMaterials",
      "model_versions_steering_materials",
      Object.keys(STEERING_MATERIAL_LABELS),
      STEERING_MATERIAL_LABELS,
    ),
    countFacetArrayValues(
      filter,
      "colors",
      "model_versions_colors_available",
      Object.keys(COLOR_LABELS),
      COLOR_LABELS,
    ),
    countTotal(filter),
  ]);

  return {
    brands,
    bodyTypes,
    fuels,
    transmissions,
    drivetrains,
    engineConfigs,
    ecoNorms,
    segments,
    seatsCounts,
    doorsCounts,
    climateZones,
    ncapStars,
    equipment,
    seatMaterials,
    steeringMaterials,
    colors,
    total,
  };
}

export async function fetchFacets(filter: VehicleFilter): Promise<FacetResult> {
  const cacheKey = filterToQueryString(filter) || "all";
  return unstable_cache(() => fetchFacetsUncached(filter), [`catalog:facets:${cacheKey}`], {
    tags: ["model_versions", "brands", "models", "body_types"],
    revalidate: ONE_HOUR,
  })();
}

export const FACET_LABELS = {
  fuel: FUEL_LABELS,
  transmission: TRANSMISSION_LABELS,
  drivetrain: DRIVETRAIN_LABELS,
  engineConfig: ENGINE_CONFIG_LABELS,
  ecoNorm: ECO_NORM_LABELS,
  segment: SEGMENT_LABELS,
  equipment: EQUIPMENT_LABELS,
  seatMaterial: SEAT_MATERIAL_LABELS,
  steeringMaterial: STEERING_MATERIAL_LABELS,
  color: COLOR_LABELS,
} as const;
