import { describe, expect, it } from "vitest";
import { sortHr, hrCollator } from "@/lib/utils/sort";

describe("hrCollator", () => {
  it("orders Croatian diacritic letters after their base letter", () => {
    expect(hrCollator.compare("c", "č")).toBeLessThan(0);
    expect(hrCollator.compare("č", "ć")).toBeLessThan(0);
    expect(hrCollator.compare("d", "đ")).toBeLessThan(0);
    expect(hrCollator.compare("s", "š")).toBeLessThan(0);
    expect(hrCollator.compare("z", "ž")).toBeLessThan(0);
  });

  it("treats case as equal (sensitivity: accent)", () => {
    expect(hrCollator.compare("Audi", "audi")).toBe(0);
  });
});

describe("sortHr", () => {
  it("sorts brand-like names with HR collation", () => {
    const items = [{ name: "Škoda" }, { name: "Audi" }, { name: "BMW" }, { name: "Citroen" }];
    expect(sortHr(items, "name")).toEqual([
      { name: "Audi" },
      { name: "BMW" },
      { name: "Citroen" },
      { name: "Škoda" },
    ]);
  });

  it("does not mutate the original array", () => {
    const items = [{ x: "B" }, { x: "A" }];
    const sorted = sortHr(items, "x");
    expect(items).toEqual([{ x: "B" }, { x: "A" }]);
    expect(sorted).toEqual([{ x: "A" }, { x: "B" }]);
  });
});
