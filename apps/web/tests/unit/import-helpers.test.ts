import { describe, it, expect } from "vitest";
import {
  extractCanonicalTokens,
  parseInchesFromText,
  parseNcapStars,
  parseNumber,
} from "../../scripts/import/helpers";

// These tests lock in CSV-importer corner cases that were debugged
// against the user-supplied catalog: substring-match semantics for
// engine config / seat material, Croatian morphology inflection,
// inch-extraction from free-text infotainment descriptors, and Euro
// NCAP star parsing (including "Nije testirano" → undefined).

describe("extractCanonicalTokens", () => {
  const SEAT = {
    tkanin: "fabric",
    Fabric: "fabric",
    "Veganska koža": "vegan_leather",
    ArtVelours: "vegan_leather",
    Vegan: "vegan_leather",
    Koža: "leather",
    Leather: "leather",
    Vernasca: "leather",
    Alcantara: "alcantara",
    ARTICO: "synthetic_leather",
    Mikrofiber: "microfiber",
  };

  it("returns empty for null/empty/undefined", () => {
    expect(extractCanonicalTokens(undefined, SEAT)).toEqual([]);
    expect(extractCanonicalTokens(null, SEAT)).toEqual([]);
    expect(extractCanonicalTokens("", SEAT)).toEqual([]);
  });

  it("returns multiple distinct canonical tokens", () => {
    const out = extractCanonicalTokens("Koža (Leather) + Alcantara", SEAT);
    expect(out).toContain("leather");
    expect(out).toContain("alcantara");
  });

  it("longest-match-wins prevents 'Veganska koža' from also tagging plain 'Koža'", () => {
    // The exact corner case from the vlasnik CSV. Without consume-span
    // logic this would yield [leather, vegan_leather] which mis-tags
    // an eco-leather car as also having plain leather.
    const out = extractCanonicalTokens("ArtVelours Eco (veganska koža)", SEAT);
    expect(out).toContain("vegan_leather");
    expect(out).not.toContain("leather");
  });

  it("returns tokens in input-position order (leftmost first)", () => {
    // For engine_config the caller takes [0] as the primary token.
    // For "Inline-4 Atmo + elektromotor" the primary ICE is inline-4,
    // electric is supplementary (engine_type=hibrid captures that).
    const ENGINE = {
      "Inline-4": "inline_4",
      Elektromotor: "electric_motor",
    };
    expect(extractCanonicalTokens("Inline-4 Atmo + elektromotor", ENGINE)).toEqual([
      "inline_4",
      "electric_motor",
    ]);
    // Reverse input → electric motor wins.
    expect(extractCanonicalTokens("PSM elektromotor + Inline-4 generator", ENGINE)).toEqual([
      "electric_motor",
      "inline_4",
    ]);
  });

  it("handles Croatian morphology via root prefix", () => {
    // "tkanin" prefix covers tkanina (nom), tkanine (gen), tkaninom
    // (instr) — Croatian noun inflection.
    expect(extractCanonicalTokens("Tkanina (Sport SofTex)", SEAT)).toEqual(["fabric"]);
    expect(extractCanonicalTokens("obloga tkaninom", SEAT)).toEqual(["fabric"]);
  });

  it("dedupes when multiple aliases of one canonical hit the input", () => {
    // "Fabric" alias and "tkanin" prefix both → fabric. Set dedups.
    const out = extractCanonicalTokens("Tkanina (Sport Fabric SofTex)", SEAT);
    expect(out.filter((t) => t === "fabric")).toHaveLength(1);
  });

  it("case-insensitive matching", () => {
    expect(extractCanonicalTokens("KOŽA Vernasca", SEAT)).toEqual(["leather"]);
    expect(extractCanonicalTokens("koža vernasca", SEAT)).toEqual(["leather"]);
  });
});

describe("parseInchesFromText", () => {
  it("returns undefined for empty/null", () => {
    expect(parseInchesFromText(undefined)).toBeUndefined();
    expect(parseInchesFromText("")).toBeUndefined();
    expect(parseInchesFromText("no number here")).toBeUndefined();
  });

  it("extracts single inch value", () => {
    expect(parseInchesFromText('12.3"')).toBe(12.3);
    expect(parseInchesFromText('10"')).toBe(10);
    expect(parseInchesFromText("9.5 inch")).toBe(9.5);
  });

  it('handles curly/smart quotes (" " " ")', () => {
    expect(parseInchesFromText("12.3”")).toBe(12.3);
    expect(parseInchesFromText("11.9“ MBUX portrait")).toBe(11.9);
  });

  it("picks the LARGEST inch value when input contains multiple", () => {
    // From the vlasnik CSV: VW ID.4 has '12" + 5.3" digitalni instrumenti'.
    // Headline filter wants the main screen size, not the cluster.
    expect(parseInchesFromText('12" + 5.3" digitalni instrumenti')).toBe(12);
    expect(parseInchesFromText('5.3" cluster + 12.3" main')).toBe(12.3);
  });

  it("handles trailing brand descriptors", () => {
    expect(parseInchesFromText('12.3" MBUX portrait')).toBe(12.3);
    expect(parseInchesFromText('10.9" PCM')).toBe(10.9);
    expect(parseInchesFromText('9"')).toBe(9);
  });

  it("handles EU decimal comma if present", () => {
    expect(parseInchesFromText('12,3"')).toBe(12.3);
  });
});

describe("parseNcapStars", () => {
  it("returns undefined for empty/null/not-tested", () => {
    expect(parseNcapStars(undefined)).toBeUndefined();
    expect(parseNcapStars("")).toBeUndefined();
    expect(parseNcapStars("Nije testirano")).toBeUndefined();
    expect(parseNcapStars("not tested")).toBeUndefined();
    expect(parseNcapStars("untested")).toBeUndefined();
  });

  it("extracts star count from Croatian zvjezdice descriptors", () => {
    expect(parseNcapStars("5 zvjezdica (2020)")).toBe(5);
    expect(parseNcapStars("5 zvjezdica (2023)")).toBe(5);
    expect(parseNcapStars("4 zvjezdice")).toBe(4);
  });

  it("extracts from English descriptors", () => {
    expect(parseNcapStars("5 stars")).toBe(5);
    expect(parseNcapStars("4 star")).toBe(4);
    expect(parseNcapStars("3★")).toBe(3);
    expect(parseNcapStars("5*")).toBe(5);
  });

  it("clamps out-of-range values to undefined", () => {
    // NCAP scale is 1-5; 0 or 6+ stars indicates upstream data error,
    // surface as null (not silently 5 or 0).
    expect(parseNcapStars("0 zvjezdica")).toBeUndefined();
    expect(parseNcapStars("6 stars")).toBeUndefined();
    expect(parseNcapStars("9 stars")).toBeUndefined();
  });

  it("ignores year/context in parentheses", () => {
    expect(parseNcapStars("5 zvjezdica (2020)")).toBe(5);
    expect(parseNcapStars("5 stars (Euro NCAP 2023 test)")).toBe(5);
  });
});

describe("parseNumber (regression — vlasnik CSV scenarios)", () => {
  it("handles trailing units", () => {
    expect(parseNumber("180 km/h")).toBe(180);
    expect(parseNumber("650 Nm")).toBe(650);
    expect(parseNumber("522 km")).toBe(522);
  });

  it("handles EU decimals with thousand separator", () => {
    expect(parseNumber("12.345,67")).toBe(12345.67);
    expect(parseNumber("1.234,5")).toBe(1234.5);
  });

  it("handles US-style decimals", () => {
    expect(parseNumber("12,345.67")).toBe(12345.67);
    expect(parseNumber("1234.5")).toBe(1234.5);
  });

  it("returns undefined for empty/garbage", () => {
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber("   ")).toBeUndefined();
    expect(parseNumber(null)).toBeUndefined();
    expect(parseNumber(undefined)).toBeUndefined();
  });
});
