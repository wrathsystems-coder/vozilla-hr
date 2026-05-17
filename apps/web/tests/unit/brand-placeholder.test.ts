import { describe, expect, it } from "vitest";
import {
  brandAbbreviation,
  brandPlaceholderColor,
  buildPlaceholderOgImage,
} from "@/lib/branding/placeholder";

describe("brandPlaceholderColor", () => {
  it("is deterministic — same slug always returns the same color", () => {
    const a = brandPlaceholderColor("audi");
    const b = brandPlaceholderColor("audi");
    expect(a.bg).toBe(b.bg);
    expect(a.hue).toBe(b.hue);
  });

  it("returns different hues for different slugs (high probability)", () => {
    const hues = new Set(
      ["audi", "bmw", "mercedes", "vw", "skoda", "ford", "kia"].map(
        (s) => brandPlaceholderColor(s).hue,
      ),
    );
    // 7 distinct slugs over 12 hue buckets — expect at least 5 unique.
    expect(hues.size).toBeGreaterThanOrEqual(5);
  });

  it("hue is one of 12 evenly-spaced slots (0, 30, 60, …)", () => {
    const allowed = new Set([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);
    for (const slug of ["audi", "bmw", "tesla", "ferrari", "porsche", "honda", "toyota"]) {
      expect(allowed.has(brandPlaceholderColor(slug).hue)).toBe(true);
    }
  });

  it("foreground is always white for fixed contrast guarantee", () => {
    expect(brandPlaceholderColor("audi").fg).toBe("#ffffff");
    expect(brandPlaceholderColor("very-long-slug-name").fg).toBe("#ffffff");
  });
});

describe("brandAbbreviation", () => {
  it("returns first 3 chars for single-word names", () => {
    expect(brandAbbreviation("Audi")).toBe("AUD");
    expect(brandAbbreviation("Tesla")).toBe("TES");
  });

  it("handles short single-word names without padding", () => {
    expect(brandAbbreviation("VW")).toBe("VW");
    expect(brandAbbreviation("Kia")).toBe("KIA");
  });

  it("returns initials for multi-word names", () => {
    expect(brandAbbreviation("Alfa Romeo")).toBe("AR");
    expect(brandAbbreviation("Mercedes-Benz")).toBe("MB");
    expect(brandAbbreviation("Land Rover")).toBe("LR");
  });

  it("caps multi-word names at 3 initials", () => {
    expect(brandAbbreviation("Bayerische Motoren Werke AG")).toBe("BMW");
  });

  it("uppercases the result", () => {
    expect(brandAbbreviation("ferrari")).toBe("FER");
    expect(brandAbbreviation("alfa romeo")).toBe("AR");
  });

  it("returns ?? when name has no letters/digits", () => {
    expect(brandAbbreviation("---")).toBe("??");
    expect(brandAbbreviation("   ")).toBe("??");
  });
});

describe("buildPlaceholderOgImage", () => {
  it("produces a data:image/svg+xml URI", () => {
    const uri = buildPlaceholderOgImage({ headline: "AUDI", caption: "vozilla.hr" });
    expect(uri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
  });

  it("escapes XML-special characters in headline + caption", () => {
    const uri = buildPlaceholderOgImage({
      headline: "A&B<C>",
      caption: "D\"E'F",
    });
    const svg = decodeURIComponent(uri.slice("data:image/svg+xml;utf8,".length));
    // Raw < / > / & / " / ' must not appear inside text-node content.
    // (They DO appear in the SVG markup itself as element delimiters,
    // hence we just confirm escaped variants land in the right places.)
    expect(svg).toContain("A&amp;B&lt;C&gt;");
    expect(svg).toContain("D&quot;E&apos;F");
  });

  it("uses the same color for the same colorSlug regardless of headline text", () => {
    const a = buildPlaceholderOgImage({ headline: "AUDI", caption: "x", colorSlug: "audi" });
    const b = buildPlaceholderOgImage({ headline: "Audi A4", caption: "y", colorSlug: "audi" });
    // Different headlines but same color slug — extract hsl(...) substring and compare.
    const colorA = decodeURIComponent(a).match(/hsl\([^)]+\)/)?.[0];
    const colorB = decodeURIComponent(b).match(/hsl\([^)]+\)/)?.[0];
    expect(colorA).toBe(colorB);
  });
});
