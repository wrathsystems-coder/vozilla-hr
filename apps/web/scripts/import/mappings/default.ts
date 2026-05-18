// Default mapping — wires "standard" English column names from the
// shipped template CSV to the import payloads. Copy this file to a
// new name (e.g. `mappings/vlasnik-katalog-2026.ts`) and adjust the
// column references when you receive the real CSV.
//
// CLI: `pnpm import:vehicles --file=seeds/template-import-vehicles.csv`
// (no --mapping arg = uses this default)

import type { VehicleMapping } from "../types";
import {
  extractCanonicalTokens,
  mapValue,
  parseBoolean,
  parseInchesFromText,
  parseIntFromString,
  parseNcapStars,
  parseNumber,
  splitMulti,
  toSlug,
} from "../helpers";

const FUEL_VALUE_MAP: Record<string, string> = {
  // Common English variants → our enum.
  Petrol: "benzin",
  Gasoline: "benzin",
  Benzin: "benzin",
  Diesel: "dizel",
  Dizel: "dizel",
  Hybrid: "hibrid",
  Hibrid: "hibrid",
  HEV: "hibrid",
  MHEV: "hibrid",
  "Mild Hybrid": "hibrid",
  "Plug-in Hybrid": "phev",
  PHEV: "phev",
  Electric: "ev",
  EV: "ev",
  BEV: "ev",
  Električni: "ev",
  LPG: "lpg",
  CNG: "cng",
};

const TRANSMISSION_VALUE_MAP: Record<string, string> = {
  Manual: "manual",
  Manualni: "manual",
  Automatic: "automatic",
  Automatski: "automatic",
  DCT: "dct",
  PDK: "dct", // Porsche's dual-clutch is functionally DCT
  DSG: "dct", // VW's dual-clutch
  CVT: "cvt",
};

const DRIVETRAIN_VALUE_MAP: Record<string, string> = {
  FWD: "fwd",
  "Front-Wheel Drive": "fwd",
  RWD: "rwd",
  "Rear-Wheel Drive": "rwd",
  AWD: "awd",
  "All-Wheel Drive": "awd",
  "4MATIC": "awd",
  xDrive: "awd",
  Quattro: "awd",
  "4x4": "4x4",
  "4WD": "4x4",
};

const BODY_TYPE_VALUE_MAP: Record<string, string> = {
  Hatchback: "hatchback",
  Sedan: "limuzina",
  Limuzina: "limuzina",
  Karavan: "karavan",
  "Station Wagon": "karavan",
  SUV: "suv",
  Crossover: "crossover",
  Coupe: "coupe",
  Cabriolet: "cabriolet",
  Convertible: "cabriolet",
  MPV: "mpv",
  Pickup: "pickup",
  Mini: "mini",
};

// Equipment free-text → canonical enum slugs. Add new aliases as the
// CSV reveals new wording — fuzzy matches stay un-mapped + are dropped
// (importer counts them in `errors` for review).
const EQUIPMENT_VALUE_MAP: Record<string, string> = {
  Panorama: "panorama",
  "Panoramic Roof": "panorama",
  "Panoramski krov": "panorama",
  HUD: "hud",
  "Head-up Display": "hud",
  "Heated Seats": "heated_seats",
  "Grijana sjedala": "heated_seats",
  "Ventilated Seats": "ventilated_seats",
  "Massage Seats": "massage_seats",
  "Memory Seats": "memory_seats",
  "Leather Seats": "leather_seats",
  "Kožna sjedala": "leather_seats",
  "Alcantara Seats": "alcantara_seats",
  "Vegan Leather": "vegan_leather_seats",
  "Eco Leather": "vegan_leather_seats",
  "Electric Seats": "electric_seats",
  "Adaptive Cruise": "adaptive_cruise",
  "Lane Assist": "lane_assist",
  "Blind Spot": "blind_spot",
  "360 Camera": "camera_360",
  "Rear Camera": "rear_camera",
  "Parking Sensors": "parking_sensors",
  "Auto Parking": "auto_parking",
  AEB: "aeb",
  "Autonomous Emergency Braking": "aeb",
  "LED Matrix": "led_matrix",
  "LED Lights": "led_lights",
  "Night Vision": "night_vision",
  "Travel Assist": "travel_assist",
  "Sport Chrono": "sport_chrono",
  PASM: "pasm",
  "Wireless Charging": "wireless_charging",
  "Apple CarPlay": "apple_carplay",
  CarPlay: "apple_carplay",
  "Android Auto": "android_auto",
  "Premium Audio": "premium_audio",
  "Harman Kardon": "harman_kardon",
  "Burmester Audio": "burmester_audio",
  Burmester: "burmester_audio",
  "Bose Audio": "bose_audio",
  Bose: "bose_audio",
};

const COLOR_VALUE_MAP: Record<string, string> = {
  White: "white",
  Bijela: "white",
  Black: "black",
  Crna: "black",
  Grey: "grey",
  Gray: "grey",
  Siva: "grey",
  Silver: "silver",
  Srebrna: "silver",
  Blue: "blue",
  Plava: "blue",
  Red: "red",
  Crvena: "red",
  Green: "green",
  Zelena: "green",
  Brown: "brown",
  Smeđa: "brown",
  Yellow: "yellow",
  Žuta: "yellow",
  Orange: "orange",
  Narančasta: "orange",
  Beige: "beige",
  Bež: "beige",
};

// Eco norm (single-value enum). Maps common EU + BEV descriptors to
// canonical slugs. "EURO 6" / "EURO VI" / "EU6" all → euro_6.
const ECO_NORM_VALUE_MAP: Record<string, string> = {
  "EURO 4": "euro_4",
  "EURO IV": "euro_4",
  EU4: "euro_4",
  "EURO 5": "euro_5",
  "EURO V": "euro_5",
  EU5: "euro_5",
  "EURO 6": "euro_6",
  "EURO VI": "euro_6",
  EU6: "euro_6",
  "EURO 6d": "euro_6d",
  "Euro 6d": "euro_6d",
  BEV: "bev",
  "BEV — nulte lokalne emisije": "bev",
  "Battery Electric": "bev",
  "Zero Emissions": "bev",
};

// Engine config — substring patterns (longest/most-specific first).
// Used with extractCanonicalTokens which substring-matches, so "Flat-6
// Bi-Turbo (Boxer)" picks up "boxer_6" via the "Flat-6" or "Boxer"
// alias. Single returned token expected — if multiple match, mapping
// keeps the first (most-specific).
const ENGINE_CONFIG_PATTERN_MAP: Record<string, string> = {
  // V configs (long ones first to win over "V")
  V12: "v12",
  V10: "v10",
  V8: "v8",
  V6: "v6",
  // Inline configs
  "Inline-3": "inline_3",
  "Inline 3": "inline_3",
  "I-3": "inline_3",
  "Inline-4": "inline_4",
  "Inline 4": "inline_4",
  "I-4": "inline_4",
  "Inline-5": "inline_5",
  "Inline 5": "inline_5",
  "I-5": "inline_5",
  "Inline-6": "inline_6",
  "Inline 6": "inline_6",
  "I-6": "inline_6",
  R6: "inline_6",
  // Boxer configs
  "Flat-6": "boxer_6",
  "Boxer-6": "boxer_6",
  "Flat-4": "boxer_4",
  "Boxer-4": "boxer_4",
  Boxer: "boxer_6", // generic — most Porsche 911s are 6cyl
  // Special configs
  Rotary: "rotary",
  Wankel: "rotary",
  // Electric (lots of HR variants)
  Elektromotor: "electric_motor",
  "Električni motor": "electric_motor",
  "Electric Motor": "electric_motor",
  elektromotor: "electric_motor",
  PSM: "electric_motor", // Permanent-magnet sync motor
  // Hybrid (when ICE + electric explicit)
  "Hybrid Motor": "hybrid_motor",
};

const SEAT_MATERIAL_PATTERN_MAP: Record<string, string> = {
  // Croatian inflection prefix — covers tkanina/tkanine/tkaninom.
  tkanin: "fabric",
  Fabric: "fabric",
  Cloth: "fabric",
  SofTex: "fabric",
  // Longer "Veganska koža" pattern must win over plain "Koža". The
  // extractor sorts by length desc + masks consumed spans, so order
  // here is informational, but keep specific-first as documentation.
  "Veganska koža": "vegan_leather",
  ArtVelours: "vegan_leather",
  Vegan: "vegan_leather",
  Koža: "leather",
  Leather: "leather",
  Vernasca: "leather",
  Nappa: "leather",
  Alcantara: "alcantara",
  ARTICO: "synthetic_leather",
  "Sintetska koža": "synthetic_leather",
  "Synthetic Leather": "synthetic_leather",
  Mikrofiber: "microfiber",
  Microfiber: "microfiber",
};

const STEERING_MATERIAL_PATTERN_MAP: Record<string, string> = {
  Koža: "leather",
  Leather: "leather",
  Alcantara: "alcantara",
  // Croatian inflection: tkanina (nom), tkanine (gen), tkaninom (instr) →
  // shared root "tkanin". Use prefix to catch all cases.
  tkanin: "fabric",
  Fabric: "fabric",
  Sintetika: "synthetic_leather",
  Plastika: "plastic",
  Plastic: "plastic",
};

function mapEnumList(raw: string | undefined, table: Record<string, string>): string[] {
  return splitMulti(raw)
    .map((token) => mapValue(token, table))
    .filter((v): v is string => Boolean(v));
}

// Parses the "Interface Type" free-text into equipment tokens. Each
// interface descriptor folds into one or more equipment[] entries —
// no separate filter dim, keeps the system unified.
function parseInterfaceFeatures(raw: string | undefined): string[] {
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const out = new Set<string>();
  if (/touchscreen|touch screen|touch-screen/.test(lower)) out.add("touchscreen");
  if (/voice|glasovn[ai]|asistent/.test(lower)) out.add("voice_assistant");
  if (/fizičke tipke|physical button|hard button/.test(lower)) out.add("physical_buttons");
  if (/rotacijski|rotary/.test(lower)) out.add("rotary_controller");
  if (/touch slider/.test(lower)) out.add("touch_sliders");
  return [...out];
}

export const defaultMapping: VehicleMapping = {
  name: "default-english-columns",

  preflight(headers) {
    const required = ["Brand", "Model"];
    const missing = required.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      throw new Error(
        `CSV missing required columns: ${missing.join(", ")}. Default mapping expects English headers. Copy mappings/default.ts and adjust column names for your CSV.`,
      );
    }
    console.log(`  → preflight ok (${headers.length} columns)`);
  },

  map(row) {
    const brandName = row.Brand?.trim();
    const modelName = row.Model?.trim();
    if (!brandName || !modelName) return null;

    const brandSlug = toSlug(brandName);
    const modelSlug = toSlug(modelName);

    const bodyTypeSlug = mapValue(row["Body Type"] || row.Category, BODY_TYPE_VALUE_MAP);
    const fuelTypes = mapEnumList(row["Fuel Types"] || row.Fuel, FUEL_VALUE_MAP);
    const transmissions = mapEnumList(
      row.Transmissions || row.Transmission,
      TRANSMISSION_VALUE_MAP,
    );

    const versionName = row.Trim?.trim() || row.Variant?.trim();

    // --- Extract canonical tokens from free-text spec columns ---
    const engineConfigRaw = row["Engine Config"]?.trim();
    const engineConfigTokens = extractCanonicalTokens(engineConfigRaw, ENGINE_CONFIG_PATTERN_MAP);
    const engineConfig = engineConfigTokens[0] as
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
      | "other"
      | undefined;

    const seatRaw = row["Seat Material"]?.trim();
    const seatTokens = extractCanonicalTokens(seatRaw, SEAT_MATERIAL_PATTERN_MAP);

    const steeringRaw = row["Steering Wheel Material"]?.trim();
    const steeringTokens = extractCanonicalTokens(steeringRaw, STEERING_MATERIAL_PATTERN_MAP);

    // Merge declared equipment[] with interface_features extracted from
    // the free-text Interface Type column. dedup preserves order of
    // declared equipment first (more deterministic for diff review).
    const declaredEquipment = mapEnumList(row.Equipment || row.Features, EQUIPMENT_VALUE_MAP);
    const interfaceEquipment = parseInterfaceFeatures(row["Interface Type"]);
    const mergedEquipment = [...new Set([...declaredEquipment, ...interfaceEquipment])];

    return {
      brand: {
        slug: brandSlug,
        name: brandName,
        country_origin: row["Country of Origin"]?.trim() || undefined,
        is_active: true,
      },
      model: {
        brandSlug,
        slug: modelSlug,
        name: modelName,
        bodyTypeSlug,
        segment:
          (row.Segment?.trim() as "A" | "B" | "C" | "D" | "E" | "F" | "J" | "M" | "S") || undefined,
        generation: row.Generation?.trim() || undefined,
        year_from: parseIntFromString(row["Year From"]),
        year_to: parseIntFromString(row["Year To"]),
        base_price_eur: parseNumber(row["Base Price (EUR)"] || row["Base Price"]),
        fuel_types: fuelTypes,
        transmissions,
        description_md: row.Description?.trim() || undefined,
        is_active: parseBoolean(row["Active"]) ?? true,
      },
      version: versionName
        ? {
            brandSlug,
            modelSlug,
            name: versionName,
            engine_type: mapValue(row["Engine Type"] || row.Fuel, FUEL_VALUE_MAP) as
              | "benzin"
              | "dizel"
              | "hibrid"
              | "phev"
              | "ev"
              | undefined,
            engine_displacement_cc: parseIntFromString(row["Engine Displacement"] || row.cc),
            engine_config: engineConfig,
            engine_config_notes: engineConfigRaw || undefined,
            eco_norm: mapValue(row["Eco Norm"] || row.Emissions, ECO_NORM_VALUE_MAP) as
              | "euro_4"
              | "euro_5"
              | "euro_6"
              | "euro_6d"
              | "bev"
              | undefined,
            power_kw: parseNumber(row["Power (kW)"] || row.kW),
            power_hp: parseNumber(row["Power (HP)"] || row.HP),
            torque_nm: parseNumber(row["Torque (Nm)"] || row.Torque),
            transmission: mapValue(row.Transmission, TRANSMISSION_VALUE_MAP) as
              | "manual"
              | "automatic"
              | "dct"
              | "cvt"
              | undefined,
            fuel_consumption_combined_l: parseNumber(row["Fuel Consumption"] || row["L/100km"]),
            co2_emission_g_km: parseNumber(row["CO2"] || row["CO2 (g/km)"]),
            ev_range_km: parseNumber(row["EV Range (km)"] || row["EV Range"]),
            price_eur: parseNumber(row["Price (EUR)"] || row.Price),
            year: parseIntFromString(row.Year),
            max_speed_kmh: parseIntFromString(row["Max Speed"] || row["Top Speed"]),
            acceleration_0_100_s: parseNumber(row["0-100 km/h"] || row.Acceleration),
            boot_capacity_l: parseIntFromString(row["Boot Capacity"] || row.Boot),
            load_capacity_kg: parseNumber(row["Load Capacity (kg)"] || row["Load Capacity"]),
            weight_kg: parseIntFromString(row["Weight (kg)"] || row.Weight),
            length_mm: parseIntFromString(row["Length (mm)"] || row.Length),
            width_mm: parseIntFromString(row["Width (mm)"] || row.Width),
            height_mm: parseIntFromString(row["Height (mm)"] || row.Height),
            wheelbase_mm: parseIntFromString(row["Wheelbase (mm)"] || row.Wheelbase),
            doors_count: parseIntFromString(row.Doors),
            seats_count: parseIntFromString(row.Seats),
            climate_zones: parseIntFromString(row["Climate Zones"]),
            infotainment_screen_in: parseInchesFromText(row["Infotainment Screen"]),
            usb_ports: parseIntFromString(row["USB Ports"]),
            euro_ncap_stars: parseNcapStars(row["Euro NCAP"] || row.NCAP),
            airbags_count: parseIntFromString(row.Airbags),
            drivetrain: mapValue(row.Drivetrain || row.Drive, DRIVETRAIN_VALUE_MAP) as
              | "fwd"
              | "rwd"
              | "awd"
              | "4x4"
              | undefined,
            equipment: mergedEquipment,
            seat_materials: seatTokens,
            seat_material_notes: seatRaw || undefined,
            steering_materials: steeringTokens,
            steering_material_notes: steeringRaw || undefined,
            colors_available: mapEnumList(row["Colors"] || row.Colours, COLOR_VALUE_MAP),
            is_current: parseBoolean(row["Active Trim"]) ?? true,
          }
        : null,
    };
    // NOTE: "Seller Location" intentionally not consumed here — that's
    // per-listing data and belongs on used_car_listings (which has its
    // own location_id FK to counties from Sprint 4). When vlasnik
    // imports used cars, a separate mapping will read Seller Location
    // and run the existing postcode→county lookup.
  },
};
