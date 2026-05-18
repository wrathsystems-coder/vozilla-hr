// Generic vehicle import contract. A mapping describes how to translate
// one CSV row into the data we need to UPSERT a Brand + Model +
// ModelVersion triple. The CLI loads a mapping module and runs the
// import; same import script + different mapping = different CSV shape.

export type RawRow = Record<string, string>;

export type BrandPayload = {
  slug: string;
  name: string;
  country_origin?: string;
  is_active?: boolean;
};

export type ModelPayload = {
  brandSlug: string;
  slug: string;
  name: string;
  bodyTypeSlug?: string;
  segment?: "A" | "B" | "C" | "D" | "E" | "F" | "J" | "M" | "S";
  generation?: string;
  year_from?: number;
  year_to?: number;
  base_price_eur?: number;
  fuel_types?: string[]; // multi-value enum: benzin/dizel/hibrid/phev/ev/lpg/cng
  transmissions?: string[]; // multi-value enum: manual/automatic/dct/cvt
  description_md?: string;
  is_active?: boolean;
};

export type EngineConfig =
  | "inline_3"
  | "inline_4"
  | "inline_5"
  | "inline_6"
  | "v6"
  | "v8"
  | "v10"
  | "v12"
  | "boxer_4"
  | "boxer_6"
  | "rotary"
  | "electric_motor"
  | "hybrid_motor"
  | "other";

export type EcoNorm = "euro_4" | "euro_5" | "euro_6" | "euro_6d" | "bev";

export type ModelVersionPayload = {
  brandSlug: string;
  modelSlug: string;
  name: string; // trim label, e.g. "2.0 TDI Sport"
  engine_type?: "benzin" | "dizel" | "hibrid" | "phev" | "ev";
  engine_displacement_cc?: number;
  engine_config?: EngineConfig;
  engine_config_notes?: string;
  eco_norm?: EcoNorm;
  power_kw?: number;
  power_hp?: number;
  torque_nm?: number;
  transmission?: "manual" | "automatic" | "dct" | "cvt";
  fuel_consumption_combined_l?: number;
  co2_emission_g_km?: number;
  ev_range_km?: number;
  price_eur?: number;
  year?: number;
  max_speed_kmh?: number;
  acceleration_0_100_s?: number;
  boot_capacity_l?: number;
  load_capacity_kg?: number;
  weight_kg?: number;
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  wheelbase_mm?: number;
  doors_count?: number;
  seats_count?: number;
  climate_zones?: number;
  infotainment_screen_in?: number;
  usb_ports?: number;
  euro_ncap_stars?: number;
  airbags_count?: number;
  drivetrain?: "fwd" | "rwd" | "awd" | "4x4";
  equipment?: string[]; // panorama / hud / heated_seats / aeb / touchscreen / …
  seat_materials?: string[]; // fabric / leather / vegan_leather / alcantara / …
  seat_material_notes?: string;
  steering_materials?: string[]; // leather / alcantara / fabric / synthetic_leather / plastic
  steering_material_notes?: string;
  colors_available?: string[];
  is_current?: boolean;
};

/**
 * One row in the CSV typically describes one ModelVersion (trim/engine).
 * The mapping extracts the three layers; the importer dedupes by slug
 * across rows so we don't re-create the same Brand or Model N times.
 *
 * If `version` is null, the row contributes only a Brand+Model UPSERT
 * (e.g. when CSV has model-level summary rows mixed with trim rows).
 *
 * If the mapper decides the row is unusable, return `null` — the
 * importer logs + counts it as skipped.
 */
export type MappedRow = {
  brand: BrandPayload;
  model: ModelPayload;
  version: ModelVersionPayload | null;
} | null;

export type VehicleMapping = {
  /** Friendly name for logs. */
  name: string;
  /** Maps one CSV row to the import triple, or null to skip the row. */
  map: (row: RawRow, rowIndex: number) => MappedRow;
  /**
   * Optional pre-flight callback. Called once after CSV is parsed +
   * before any UPSERT. Use it to validate header presence, log
   * column → field bindings, or short-circuit with a clear error if
   * the mapping doesn't fit the data.
   */
  preflight?: (headers: string[], sampleRow: RawRow) => void;
};

export type ImportSummary = {
  rowsRead: number;
  rowsMapped: number;
  rowsSkipped: number;
  brandsCreated: number;
  brandsUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  versionsCreated: number;
  versionsUpdated: number;
  bodyTypesCreated: number;
  errors: Array<{ row: number; reason: string }>;
};
