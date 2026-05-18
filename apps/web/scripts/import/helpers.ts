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
 * Substring-matches a free-text descriptor against a token pattern map.
 * Returns the deduplicated set of canonical tokens whose alias appears
 * anywhere in the input.
 *
 * **Longest-match-wins**: patterns are tried sorted by length descending,
 * and once a span of the input is consumed by a match, shorter patterns
 * can't re-match within that span. This prevents "Veganska koža"
 * (specific → vegan_leather) from also tagging "Koža" (generic →
 * leather), and "Inline-4" from also matching a hypothetical "Inline"
 * generic. Standard tokenizer semantics — predictable for diff review.
 *
 * Used for fields like "Seat Material" or "Engine Config" where the
 * CSV ships brand-decorated free text ("Koža Vernasca (M Sport
 * perforirana)") rather than canonical enum values — we extract
 * `leather` from the substring "Koža" and keep the raw text as a
 * separate notes field for display.
 */
export function extractCanonicalTokens(
  input: string | undefined | null,
  patternMap: Record<string, string>,
): string[] {
  if (!input) return [];
  const haystack = input.toLowerCase();
  const consumed = new Array<boolean>(haystack.length).fill(false);
  // Record each match's start position so we can return tokens in
  // input-order. Maps `canonical → earliest position seen`.
  const positions = new Map<string, number>();

  // Sort patterns by length desc — longest, most-specific wins for any
  // overlapping spans. "Veganska koža" claims its span before plain
  // "Koža" can re-match within it.
  const patterns = Object.entries(patternMap).sort((a, b) => b[0].length - a[0].length);

  for (const [needle, canonical] of patterns) {
    const lower = needle.toLowerCase();
    let from = 0;
    while (from <= haystack.length - lower.length) {
      const idx = haystack.indexOf(lower, from);
      if (idx === -1) break;
      let overlap = false;
      for (let i = idx; i < idx + lower.length; i++) {
        if (consumed[i]) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        for (let i = idx; i < idx + lower.length; i++) consumed[i] = true;
        // First (leftmost) occurrence wins for ordering.
        const prev = positions.get(canonical);
        if (prev === undefined || idx < prev) positions.set(canonical, idx);
      }
      from = idx + lower.length;
    }
  }
  // Return canonicals sorted by their leftmost occurrence in the input.
  // For engine_config-style fields, callers take [0] = primary token.
  return [...positions.entries()].sort((a, b) => a[1] - b[1]).map(([canonical]) => canonical);
}

/**
 * Extracts the LARGEST numeric inch value from a free-text descriptor
 * like '12.3"' or '12" + 5.3" digitalni instrumenti'. Returns undefined
 * if no inch value present. The "largest" rule reflects display intent
 * — when a car has a 12" main + 5.3" instrument cluster, the headline
 * filter wants the bigger one.
 */
export function parseInchesFromText(v: string | undefined | null): number | undefined {
  if (!v) return undefined;
  // Match numbers followed by " or " or inch/inča — keep all matches.
  const matches = [...v.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:["“”]|inch|inča)/gi)];
  if (matches.length === 0) return undefined;
  const nums = matches
    .map((m) => parseNumber(m[1]))
    .filter((n): n is number => typeof n === "number");
  if (nums.length === 0) return undefined;
  return Math.max(...nums);
}

/**
 * Extracts star count from Euro NCAP descriptors like:
 *   "5 zvjezdica (2020)"  → 5
 *   "5 stars"             → 5
 *   "Nije testirano"      → undefined (not tested ≠ 0 stars)
 *   ""                    → undefined
 * Out-of-range values clamp to undefined (5-star is the max NCAP scale).
 */
export function parseNcapStars(v: string | undefined | null): number | undefined {
  if (!v) return undefined;
  const t = v.trim().toLowerCase();
  if (!t || t.startsWith("nije") || t.includes("not tested") || t.includes("untested")) {
    return undefined;
  }
  const m = t.match(/(\d)\s*(?:zvjezdic|star|stars|★|\*)/);
  if (!m) return undefined;
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
  return n;
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
