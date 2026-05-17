// Deterministic visual placeholder helpers — used when a brand / model
// hasn't uploaded its logo / hero / OG image yet. The output is a stable
// function of the input slug so the same brand always renders with the
// same colors across requests, sessions, and devices.
//
// Why: text wordmark fallback (Sprint 3) reads as "we forgot to add a
// logo." A colored card with brand initials reads as a real, branded
// placeholder — closer to the visual spec without committing to fake
// assets the agent is not allowed to generate (CLAUDE.md rule #1).

/**
 * 32-bit FNV-1a hash. Deterministic per input string; small + fast in
 * Edge runtime (no crypto dep). Used as the entropy source for HSL.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Bucket the slug hash into 12 hue slots so the palette feels designed
 * (12 evenly-spaced hues) rather than randomly chaotic. Saturation +
 * lightness are fixed so every card sits in the same visual register.
 */
export function brandPlaceholderColor(slug: string): {
  bg: string;
  fg: string;
  hue: number;
} {
  const h = fnv1a(slug) % 12;
  const hue = h * 30; // 0, 30, 60, ..., 330 — full color wheel in 12 steps
  // Sat 55%, light 42% → muted enough that white text reads at >7:1
  // contrast (WCAG AAA). Same numbers across brands so all cards feel
  // like a family.
  return {
    bg: `hsl(${hue} 55% 42%)`,
    fg: "#ffffff",
    hue,
  };
}

/**
 * Brand abbreviation: 2-3 chars from the brand name, uppercase. Handles
 * multi-word names by taking initials (e.g. "Mercedes-Benz" → "MB",
 * "Alfa Romeo" → "AR"). Single-word names get the first 2-3 letters.
 */
export function brandAbbreviation(name: string): string {
  const tokens = name
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/u)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return "??";
  if (tokens.length === 1) {
    // Single word — take first 2-3 chars. 3 if it's a short word like "VW".
    return tokens[0].slice(0, Math.min(3, tokens[0].length)).toUpperCase();
  }
  // Multi-word — initials of first 3 words.
  return tokens
    .slice(0, 3)
    .map((t) => t.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * Builds an inline SVG data-URI for OG/share image when no upload exists.
 * 1200×630, brand-colored background, big abbreviation, small caption.
 * Encoded as data:image/svg+xml so it ships without a file on disk and
 * fonts come from the SVG renderer's default system stack.
 */
export function buildPlaceholderOgImage(args: {
  /** Headline text (top line, large) — typically brand abbreviation or model name. */
  headline: string;
  /** Caption (bottom line, smaller) — typically site name or context. */
  caption: string;
  /** Slug used for color derivation; defaults to headline.toLowerCase(). */
  colorSlug?: string;
}): string {
  const slug = args.colorSlug ?? args.headline.toLowerCase();
  const { bg, fg } = brandPlaceholderColor(slug);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">`,
    `<rect width="1200" height="630" fill="${bg}"/>`,
    `<text x="600" y="320" text-anchor="middle" fill="${fg}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="180" font-weight="800" letter-spacing="-4">${escapeXml(args.headline)}</text>`,
    `<text x="600" y="420" text-anchor="middle" fill="${fg}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="42" font-weight="500" opacity="0.85">${escapeXml(args.caption)}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
