import { describe, expect, it } from "vitest";
import {
  filterToQueryString,
  isFilterEmpty,
  parseFilter,
  USED_CAR_PAGE_SIZE,
  type UsedCarFilter,
} from "@/lib/used-cars/filter";

describe("used-cars filter — parseFilter", () => {
  it("empty search params → defaults (sort='newest', page=1, no fields)", () => {
    const f = parseFilter({});
    expect(f.sort).toBe("newest");
    expect(f.page).toBe(1);
    expect(isFilterEmpty(f)).toBe(true);
  });

  it("reads all supported HR-named params", () => {
    const f = parseFilter({
      marka: "audi",
      model: "a4",
      kategorija: "sedan",
      pogon: "dizel",
      mjenjac: "automatic",
      cijena_od: "10000",
      cijena_do: "50000",
      godina_od: "2018",
      godina_do: "2024",
      km_od: "0",
      km_do: "150000",
      zupanija: "21",
      sort: "cheapest",
      p: "3",
    });
    expect(f).toMatchObject({
      brandSlug: "audi",
      modelSlug: "a4",
      bodyTypeSlug: "sedan",
      fuel: "dizel",
      transmission: "automatic",
      priceMin: 10000,
      priceMax: 50000,
      yearMin: 2018,
      yearMax: 2024,
      kmMin: 0,
      kmMax: 150000,
      countyId: 21,
      sort: "cheapest",
      page: 3,
    });
  });

  it("invalid sort falls back to newest", () => {
    expect(parseFilter({ sort: "garbage" }).sort).toBe("newest");
    expect(parseFilter({ sort: ["cheapest", "leastKm"] }).sort).toBe("cheapest"); // picks first
  });

  it("non-positive page clamps to 1", () => {
    expect(parseFilter({ p: "0" }).page).toBe(1);
    expect(parseFilter({ p: "-5" }).page).toBe(1);
    expect(parseFilter({ p: "abc" }).page).toBe(1);
  });

  it("rejects negative numbers for ranges", () => {
    const f = parseFilter({ cijena_od: "-1000", godina_do: "-2024" });
    expect(f.priceMin).toBeUndefined();
    expect(f.yearMax).toBeUndefined();
  });

  it("empty-string slug values are treated as unset", () => {
    const f = parseFilter({ marka: "", model: "" });
    expect(f.brandSlug).toBeUndefined();
    expect(f.modelSlug).toBeUndefined();
  });
});

describe("used-cars filter — filterToQueryString", () => {
  it("omits default sort + default page", () => {
    expect(filterToQueryString({ sort: "newest", page: 1 })).toBe("");
    expect(filterToQueryString({ sort: "newest", page: 2 })).toBe("p=2");
    expect(filterToQueryString({ sort: "cheapest", page: 1 })).toBe("sort=cheapest");
  });

  it("emits every set field with HR-named params", () => {
    const qs = filterToQueryString({
      brandSlug: "audi",
      fuel: "dizel",
      priceMin: 10000,
      priceMax: 50000,
      sort: "leastKm",
      page: 2,
    });
    expect(qs).toContain("marka=audi");
    expect(qs).toContain("pogon=dizel");
    expect(qs).toContain("cijena_od=10000");
    expect(qs).toContain("cijena_do=50000");
    expect(qs).toContain("sort=leastKm");
    expect(qs).toContain("p=2");
  });

  it("kmMin=0 still serialises (don't treat 0 as unset)", () => {
    // Explicit "from 0 km" is meaningful — a slider snapped to the lower
    // bound is not the same as "no minimum".
    expect(filterToQueryString({ sort: "newest", page: 1, kmMin: 0 })).toContain("km_od=0");
  });
});

describe("used-cars filter — round-trip parity", () => {
  it("parseFilter ∘ filterToQueryString is identity for non-default values", () => {
    const original: UsedCarFilter = {
      brandSlug: "skoda",
      modelSlug: "octavia",
      bodyTypeSlug: "karavan",
      fuel: "phev",
      transmission: "dct",
      priceMin: 15000,
      priceMax: 35000,
      yearMin: 2019,
      yearMax: 2025,
      kmMin: 5000,
      kmMax: 120000,
      countyId: 21,
      sort: "leastKm",
      page: 4,
    };
    const qs = filterToQueryString(original);
    const reparsed = parseFilter(Object.fromEntries(new URLSearchParams(qs)));
    expect(reparsed).toEqual(original);
  });
});

describe("used-cars filter — isFilterEmpty + USED_CAR_PAGE_SIZE", () => {
  it("default filter is empty even with sort='newest' / page=1", () => {
    expect(isFilterEmpty(parseFilter({}))).toBe(true);
  });

  it("any set field makes the filter non-empty (incl. priceMin=0)", () => {
    expect(isFilterEmpty(parseFilter({ marka: "audi" }))).toBe(false);
    expect(isFilterEmpty(parseFilter({ cijena_od: "0" }))).toBe(false);
  });

  it("PAGE_SIZE is 25 (matches spec)", () => {
    expect(USED_CAR_PAGE_SIZE).toBe(25);
  });
});
