// Shared parsing helpers that mappings reuse. Keeps each mapping file
// short — the mapping describes *what* maps where, not *how* to parse
// a number with a comma decimal separator.

/**
 * Parses a CSV value as float. Handles European decimals ("12,5" →
 * 12.5) + thousand separators ("12.345,67" → 12345.67) + trailing
 * unit hints ("180 km/h" → 180). Returns undefined for empty / NaN.
 */
export function parseNumber(v: string | undefined | null): number | undefined {
  if (v == null) return undefined;
  const trimmed = String(v).trim();
  if (!trimmed) return undefined;

  // Strip trailing unit segments after the last digit-related char.
  const numericPart = trimmed.replace(/[^0-9.,+\-]/g, "").trim();
  if (!numericPart) return undefined;

  // Normalize EU decimal: if both '.' and ',' present, last one is decimal.
  // If only ',' present, treat as decimal. If only '.' present, treat as
  // decimal (US style).
  let normalized: string;
  if (numericPart.includes(",") && numericPart.includes(".")) {
    const lastComma = numericPart.lastIndexOf(",");
    const lastDot = numericPart.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = numericPart.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = numericPart.replace(/,/g, "");
    }
  } else if (numericPart.includes(",")) {
    normalized = numericPart.replace(",", ".");
  } else {
    normalized = numericPart;
  }

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export function parseIntFromString(v: string | undefined | null): number | undefined {
  const n = parseNumber(v);
  if (n === undefined) return undefined;
  return Math.trunc(n);
}

/**
 * Parses a multi-value cell into an array of trimmed tokens. Default
 * separators: semicolon, pipe, comma. Empty tokens dropped.
 */
export function splitMulti(v: string | undefined | null, separator: RegExp = /[;|,]/): string[] {
  if (!v) return [];
  return v
    .split(separator)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Looks up a free-text value in a value map. Case-insensitive on keys;
 * returns the mapped value or undefined for unknown inputs (mapping
 * decides whether unknown is fatal or just dropped).
 */
export function mapValue(
  input: string | undefined | null,
  map: Record<string, string>,
): string | undefined {
  if (!input) return undefined;
  const key = input.trim().toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === key) return v;
  }
  return undefined;
}

/**
 * ASCII-safe slug. Drops diacritics, lowercases, replaces non-
 * alphanumeric with single hyphen. Conforms to CLAUDE.md "URL slug"
 * rule (skoda-octavia, ne škoda-octavia).
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseBoolean(v: string | undefined | null): boolean | undefined {
  if (v == null) return undefined;
  const t = String(v).trim().toLowerCase();
  if (["true", "yes", "1", "y", "da"].includes(t)) return true;
  if (["false", "no", "0", "n", "ne"].includes(t)) return false;
  return undefined;
}
