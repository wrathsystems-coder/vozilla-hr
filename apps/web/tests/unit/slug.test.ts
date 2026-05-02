import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("removes Croatian diacritics", () => {
    expect(slugify("Škoda Octavia")).toBe("skoda-octavia");
    expect(slugify("Đakovština")).toBe("dakovstina");
    expect(slugify("Težišnik s čekićem")).toBe("tezisnik-s-cekicem");
  });

  it("collapses non-ASCII characters to hyphens", () => {
    expect(slugify("Audi A4 (2024)")).toBe("audi-a4-2024");
    expect(slugify("BMW M3 / M4")).toBe("bmw-m3-m4");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("   Test   ")).toBe("test");
    expect(slugify("---hello---")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});
