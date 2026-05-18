import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/audit-csv.mjs <path-to-csv>");
  process.exit(1);
}

const text = readFileSync(file, "utf-8");
const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
const cols = Object.keys(rows[0]);
const CORE = new Set([
  "Brand","Model","Trim","Body Type","Segment","Generation","Year From","Year To","Year",
  "Base Price (EUR)","Price (EUR)","Country of Origin","Fuel Types","Engine Type",
  "Engine Displacement","Power (kW)","Power (HP)","Transmission","Drivetrain",
  "Fuel Consumption","CO2 (g/km)","Max Speed","0-100 km/h","Boot Capacity","Weight (kg)",
  "Length (mm)","Width (mm)","Height (mm)","Wheelbase (mm)","Doors","Seats",
  "Equipment","Colors","Active","Active Trim",
]);

const newCols = cols.filter((c) => !CORE.has(c));
console.log(`rows: ${rows.length}, columns: ${cols.length} (${CORE.size} core + ${newCols.length} new)\n`);

console.log("=== NEW columns ===");
for (const c of newCols) {
  const vals = rows.map((r) => r[c]).filter((v) => v && v.length > 0);
  console.log(`  ${c} (${vals.length}/${rows.length} populated)`);
  for (const v of vals) console.log(`    ${v.substring(0, 100)}`);
}

console.log("\n=== EQUIPMENT distinct tokens ===");
const eq = new Set();
rows.forEach((r) => (r.Equipment || "").split(/[;|]/).map((t) => t.trim()).filter(Boolean).forEach((t) => eq.add(t)));
[...eq].sort().forEach((t) => console.log("  " + t));

console.log("\n=== Colors distinct ===");
const col = new Set();
rows.forEach((r) => (r.Colors || "").split(/[;|]/).map((t) => t.trim()).filter(Boolean).forEach((t) => col.add(t)));
[...col].sort().forEach((t) => console.log("  " + t));

const dump = (label, col) => {
  console.log(`\n=== ${label} distinct ===`);
  [...new Set(rows.map((r) => r[col]).filter(Boolean))].forEach((t) => console.log("  " + t));
};
dump("Body Type", "Body Type");
dump("Fuel Types", "Fuel Types");
dump("Engine Type", "Engine Type");
dump("Transmission", "Transmission");
dump("Drivetrain", "Drivetrain");

console.log("\n=== Numeric / range columns — min..max ===");
const num = (s) => {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[^0-9.,+\-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const ranges = ["Max Speed","0-100 km/h","Boot Capacity","Weight (kg)","Power (HP)","Power (kW)","Price (EUR)","Year","Torque (Nm)","EV Range (km)","Load Capacity (kg)","Climate Zones","USB Ports","Airbags"];
for (const c of ranges) {
  if (!cols.includes(c)) continue;
  const vs = rows.map((r) => num(r[c])).filter((v) => v !== null);
  if (vs.length === 0) {
    console.log(`  ${c}: no values`);
    continue;
  }
  console.log(`  ${c}: ${Math.min(...vs)}..${Math.max(...vs)} (${vs.length}/${rows.length})`);
}
