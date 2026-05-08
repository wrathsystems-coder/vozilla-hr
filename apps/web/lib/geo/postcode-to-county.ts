import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// HR postcode → county/city lookup, keyed on the 2-digit postcode prefix.
// Source: seeds/postcodes-counties-hr.json (intentionally sparse — 10 major
// cities for MVP). Lead wizard step 3 calls this to auto-fill the county
// dropdown; if it returns null the user picks from the 21-county list.

const dirname = path.dirname(fileURLToPath(import.meta.url));

type Entry = { postcode_prefix: string; county_id: number; city: string };

let _entries: Entry[] | null = null;

function loadEntries(): Entry[] {
  if (_entries) return _entries;
  // apps/web/lib/geo/postcode-to-county.ts → ../../../../seeds/postcodes-counties-hr.json
  const jsonPath = path.resolve(dirname, "../../../../seeds/postcodes-counties-hr.json");
  const text = readFileSync(jsonPath, "utf-8");
  _entries = JSON.parse(text) as Entry[];
  return _entries;
}

export function _resetCache(): void {
  _entries = null;
}

export type PostcodeMapping = {
  countyId: number;
  city: string;
};

export function postcodeToCounty(postcode: string): PostcodeMapping | null {
  if (!/^\d{5}$/.test(postcode)) return null;
  const prefix = postcode.slice(0, 2);
  const match = loadEntries().find((m) => m.postcode_prefix === prefix);
  return match ? { countyId: match.county_id, city: match.city } : null;
}
