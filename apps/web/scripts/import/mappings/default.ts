// Default mapping — wires "standard" English column names from the
// shipped template CSV to the import payloads. Copy this file to a
// new name (e.g. `mappings/vlasnik-katalog-2026.ts`) and adjust the
// column references when you receive the real CSV.
//
// CLI: `pnpm import:vehicles --file=seeds/template-import-vehicles.csv`
// (no --mapping arg = uses this default)

import type { VehicleMapping } from "../types";
import {
  mapValue,
  parseBoolean,
  parseIntFromString,
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
  "Plug-in Hybrid": "phev",
  PHEV: "phev",
  Electric: "ev",
  EV: "ev",
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
  CVT: "cvt",
};

const DRIVETRAIN_VALUE_MAP: Record<string, string> = {
  FWD: "fwd",
  "Front-Wheel Drive": "fwd",
  RWD: "rwd",
  "Rear-Wheel Drive": "rwd",
  AWD: "awd",
  "All-Wheel Drive": "awd",
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
  "Leather Seats": "leather_seats",
  "Kožna sjedala": "leather_seats",
  "Electric Seats": "electric_seats",
  "Adaptive Cruise": "adaptive_cruise",
  "Lane Assist": "lane_assist",
  "Blind Spot": "blind_spot",
  "360 Camera": "camera_360",
  "Parking Sensors": "parking_sensors",
  "LED Matrix": "led_matrix",
  "Wireless Charging": "wireless_charging",
  "Apple CarPlay": "apple_carplay",
  CarPlay: "apple_carplay",
  "Android Auto": "android_auto",
  "Premium Audio": "premium_audio",
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

function mapEnumList(raw: string | undefined, table: Record<string, string>): string[] {
  return splitMulti(raw)
    .map((token) => mapValue(token, table))
    .filter((v): v is string => Boolean(v));
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
            power_kw: parseNumber(row["Power (kW)"] || row.kW),
            power_hp: parseNumber(row["Power (HP)"] || row.HP),
            transmission: mapValue(row.Transmission, TRANSMISSION_VALUE_MAP) as
              | "manual"
              | "automatic"
              | "dct"
              | "cvt"
              | undefined,
            fuel_consumption_combined_l: parseNumber(row["Fuel Consumption"] || row["L/100km"]),
            co2_emission_g_km: parseNumber(row["CO2"] || row["CO2 (g/km)"]),
            price_eur: parseNumber(row["Price (EUR)"] || row.Price),
            year: parseIntFromString(row.Year),
            max_speed_kmh: parseIntFromString(row["Max Speed"] || row["Top Speed"]),
            acceleration_0_100_s: parseNumber(row["0-100 km/h"] || row.Acceleration),
            boot_capacity_l: parseIntFromString(row["Boot Capacity"] || row.Boot),
            weight_kg: parseIntFromString(row["Weight (kg)"] || row.Weight),
            length_mm: parseIntFromString(row["Length (mm)"] || row.Length),
            width_mm: parseIntFromString(row["Width (mm)"] || row.Width),
            height_mm: parseIntFromString(row["Height (mm)"] || row.Height),
            wheelbase_mm: parseIntFromString(row["Wheelbase (mm)"] || row.Wheelbase),
            doors_count: parseIntFromString(row.Doors),
            seats_count: parseIntFromString(row.Seats),
            drivetrain: mapValue(row.Drivetrain || row.Drive, DRIVETRAIN_VALUE_MAP) as
              | "fwd"
              | "rwd"
              | "awd"
              | "4x4"
              | undefined,
            equipment: mapEnumList(row.Equipment || row.Features, EQUIPMENT_VALUE_MAP),
            colors_available: mapEnumList(row["Colors"] || row.Colours, COLOR_VALUE_MAP),
            is_current: parseBoolean(row["Active Trim"]) ?? true,
          }
        : null,
    };
  },
};
