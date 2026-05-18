// Diagnostic: runs the default mapping against a CSV and dumps the
// resulting payload for the first N rows. Useful to verify the new
// fields (torque, eco_norm, engine_config, seat_materials, etc.)
// extract as expected before doing a real import.

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { pathToFileURL } from "url";
import path from "path";

const file = process.argv[2];
const limit = Number(process.argv[3] || 3);
if (!file) {
  console.error("usage: node scripts/audit-mapping.mjs <csv> [limit]");
  process.exit(1);
}

const text = readFileSync(file, "utf-8");
const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });

const mappingPath = path.resolve("scripts/import/mappings/default.ts");
const mod = await import(pathToFileURL(mappingPath).href);
const mapping = mod.defaultMapping;

console.log(`Mapping: ${mapping.name}\n`);

const sample = rows.slice(0, limit);
for (let i = 0; i < sample.length; i++) {
  const row = sample[i];
  const result = mapping.map(row, i);
  if (!result || !result.version) {
    console.log(`Row ${i}: SKIPPED`);
    continue;
  }
  const v = result.version;
  console.log(`--- Row ${i}: ${result.brand.name} ${result.model.name} ${v.name} ---`);
  console.log(`  engine_type:           ${v.engine_type}`);
  console.log(`  engine_config:         ${v.engine_config} (from: "${v.engine_config_notes}")`);
  console.log(`  eco_norm:              ${v.eco_norm}`);
  console.log(`  power_hp/kw:           ${v.power_hp}/${v.power_kw}`);
  console.log(`  torque_nm:             ${v.torque_nm}`);
  console.log(`  transmission:          ${v.transmission}`);
  console.log(`  drivetrain:            ${v.drivetrain}`);
  console.log(`  fuel_consumption:      ${v.fuel_consumption_combined_l} L/100km, CO2 ${v.co2_emission_g_km} g/km`);
  console.log(`  ev_range_km:           ${v.ev_range_km}`);
  console.log(`  price/year:            ${v.price_eur} EUR / ${v.year}`);
  console.log(`  max_speed/accel:       ${v.max_speed_kmh} km/h / ${v.acceleration_0_100_s} s`);
  console.log(`  boot/load:             ${v.boot_capacity_l} L / ${v.load_capacity_kg} kg payload`);
  console.log(`  weight/dims:           ${v.weight_kg} kg, ${v.length_mm}x${v.width_mm}x${v.height_mm} mm`);
  console.log(`  doors/seats:           ${v.doors_count}/${v.seats_count}`);
  console.log(`  climate_zones:         ${v.climate_zones}`);
  console.log(`  infotainment_screen:   ${v.infotainment_screen_in}"`);
  console.log(`  usb_ports:             ${v.usb_ports}`);
  console.log(`  euro_ncap_stars:       ${v.euro_ncap_stars}`);
  console.log(`  airbags_count:         ${v.airbags_count}`);
  console.log(`  equipment (${v.equipment?.length}):    ${v.equipment?.join(", ")}`);
  console.log(`  seat_materials:        [${v.seat_materials?.join(", ")}] (from: "${v.seat_material_notes}")`);
  console.log(`  steering_materials:    [${v.steering_materials?.join(", ")}] (from: "${v.steering_material_notes}")`);
  console.log(`  colors_available (${v.colors_available?.length}): ${v.colors_available?.join(", ")}`);
  console.log("");
}
