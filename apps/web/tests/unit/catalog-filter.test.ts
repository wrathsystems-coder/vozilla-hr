import { describe, it, expect } from "vitest";
import {
  parseFilter,
  filterToQueryString,
  emptyFilter,
  isFilterEmpty,
  hasAnyFilter,
  removeMultiValue,
  clearRange,
  type VehicleFilter,
} from "../../lib/catalog/filter";

// These tests lock in the URL ↔ filter parity described in
// `docs/filter-architecture.md`. The contract is: parse(serialize(x)) ≡ x
// for any valid filter state. Default values (sort=newest, p=1) are
// omitted from URL but round-trip through `emptyFilter()` cleanly.

describe("parseFilter — multi-select", () => {
  it("returns empty filter for empty searchParams", () => {
    const f = parseFilter({});
    expect(isFilterEmpty(f)).toBe(true);
    expect(f.sort).toBe("newest");
    expect(f.page).toBe(1);
  });

  it("parses single multi-select value", () => {
    expect(parseFilter({ marka: "audi" }).brands).toEqual(["audi"]);
  });

  it("parses comma-separated multi-select", () => {
    expect(parseFilter({ marka: "audi,bmw,mercedes" }).brands).toEqual(["audi", "bmw", "mercedes"]);
  });

  it("parses repeated param keys (Next-style array)", () => {
    expect(parseFilter({ marka: ["audi", "bmw"] }).brands).toEqual(["audi", "bmw"]);
  });

  it("accepts repeated keys AND comma-separated together (gracefully)", () => {
    expect(parseFilter({ marka: ["audi,bmw", "mercedes"] }).brands).toEqual([
      "audi",
      "bmw",
      "mercedes",
    ]);
  });

  it("trims whitespace and drops empty tokens", () => {
    expect(parseFilter({ marka: "audi, ,bmw,  ,mercedes" }).brands).toEqual([
      "audi",
      "bmw",
      "mercedes",
    ]);
  });

  it("parses int arrays for small-int dims", () => {
    expect(parseFilter({ sjedala: "5,7" }).seatsCounts).toEqual([5, 7]);
    expect(parseFilter({ ncap: "4,5" }).ncapStars).toEqual([4, 5]);
  });

  it("drops invalid int array entries silently", () => {
    expect(parseFilter({ sjedala: "5,foo,7" }).seatsCounts).toEqual([5, 7]);
  });
});

describe("parseFilter — range params", () => {
  it("parses both min and max", () => {
    const f = parseFilter({ cijena_od: "20000", cijena_do: "40000" });
    expect(f.price).toEqual({ min: 20000, max: 40000 });
  });

  it("parses min only", () => {
    expect(parseFilter({ snaga_od: "150" }).powerHp).toEqual({ min: 150, max: undefined });
  });

  it("parses max only", () => {
    expect(parseFilter({ snaga_do: "300" }).powerHp).toEqual({ min: undefined, max: 300 });
  });

  it("supports float ranges (acceleration, consumption, screen)", () => {
    expect(parseFilter({ ubrzanje_od: "5.5", ubrzanje_do: "8.2" }).acceleration).toEqual({
      min: 5.5,
      max: 8.2,
    });
    expect(parseFilter({ ekran_od: "10.5", ekran_do: "12.3" }).screenInches).toEqual({
      min: 10.5,
      max: 12.3,
    });
  });

  it("drops negative / NaN range entries silently", () => {
    expect(parseFilter({ cijena_od: "-100", cijena_do: "abc" }).price).toEqual({});
  });
});

describe("parseFilter — sort + page", () => {
  it("falls back to newest for unknown sort", () => {
    expect(parseFilter({ sort: "wibble" }).sort).toBe("newest");
  });

  it("accepts known sort values", () => {
    expect(parseFilter({ sort: "cheapest" }).sort).toBe("cheapest");
    expect(parseFilter({ sort: "priciest" }).sort).toBe("priciest");
    expect(parseFilter({ sort: "mostPower" }).sort).toBe("mostPower");
  });

  it("page falls back to 1 for zero/negative/missing", () => {
    expect(parseFilter({ p: "0" }).page).toBe(1);
    expect(parseFilter({ p: "-5" }).page).toBe(1);
    expect(parseFilter({}).page).toBe(1);
  });

  it("parses positive page", () => {
    expect(parseFilter({ p: "3" }).page).toBe(3);
  });
});

describe("filterToQueryString — serialization", () => {
  it("returns empty string for empty filter", () => {
    expect(filterToQueryString(emptyFilter())).toBe("");
  });

  it("omits default sort + default page from URL", () => {
    const f: VehicleFilter = { ...emptyFilter(), brands: ["audi"], sort: "newest", page: 1 };
    expect(filterToQueryString(f)).toBe("marka=audi");
  });

  it("includes non-default sort + page", () => {
    const f: VehicleFilter = {
      ...emptyFilter(),
      brands: ["audi"],
      sort: "cheapest",
      page: 3,
    };
    const qs = filterToQueryString(f);
    expect(qs).toContain("marka=audi");
    expect(qs).toContain("sort=cheapest");
    expect(qs).toContain("p=3");
  });

  it("comma-joins multi-select values", () => {
    const f: VehicleFilter = { ...emptyFilter(), brands: ["audi", "bmw", "mercedes"] };
    expect(filterToQueryString(f)).toBe("marka=audi%2Cbmw%2Cmercedes");
  });

  it("emits _od + _do for ranges", () => {
    const f: VehicleFilter = { ...emptyFilter(), price: { min: 20000, max: 40000 } };
    const qs = filterToQueryString(f);
    expect(qs).toContain("cijena_od=20000");
    expect(qs).toContain("cijena_do=40000");
  });

  it("emits only set side of a one-sided range", () => {
    const f: VehicleFilter = { ...emptyFilter(), powerHp: { min: 200 } };
    const qs = filterToQueryString(f);
    expect(qs).toContain("snaga_od=200");
    expect(qs).not.toContain("snaga_do");
  });
});

describe("round-trip parity (parse ∘ serialize ≡ id)", () => {
  const cases: Array<[string, VehicleFilter]> = [
    ["empty", emptyFilter()],
    [
      "multi brands + multi fuels + price range",
      {
        ...emptyFilter(),
        brands: ["audi", "bmw"],
        fuels: ["dizel", "hibrid"],
        price: { min: 20000, max: 40000 },
      },
    ],
    [
      "all spec dims (the wide test)",
      {
        ...emptyFilter(),
        brands: ["audi"],
        bodyTypes: ["suv"],
        transmissions: ["automatic"],
        drivetrains: ["awd"],
        engineConfigs: ["v6"],
        ecoNorms: ["euro_6"],
        equipment: ["panorama", "hud"],
        seatMaterials: ["leather"],
        steeringMaterials: ["alcantara"],
        seatsCounts: [5, 7],
        ncapStars: [5],
        climateZones: [4],
        powerHp: { min: 200, max: 400 },
        torqueNm: { min: 400 },
        evRange: { max: 500 },
        screenInches: { min: 10.5 },
        sort: "cheapest",
        page: 2,
      },
    ],
  ];

  for (const [label, original] of cases) {
    it(`round-trips: ${label}`, () => {
      const qs = filterToQueryString(original);
      const parsed = parseFilter(Object.fromEntries(new URLSearchParams(qs)));
      expect(parsed).toEqual(original);
    });
  }
});

describe("isFilterEmpty / hasAnyFilter", () => {
  it("emptyFilter() is empty", () => {
    expect(isFilterEmpty(emptyFilter())).toBe(true);
    expect(hasAnyFilter(emptyFilter())).toBe(false);
  });

  it("sort + page changes don't count as 'has filter'", () => {
    const f: VehicleFilter = { ...emptyFilter(), sort: "cheapest", page: 5 };
    expect(isFilterEmpty(f)).toBe(true);
    expect(hasAnyFilter(f)).toBe(false);
  });

  it("any multi-select pick counts", () => {
    expect(hasAnyFilter({ ...emptyFilter(), brands: ["audi"] })).toBe(true);
  });

  it("any range bound counts", () => {
    expect(hasAnyFilter({ ...emptyFilter(), price: { min: 10000 } })).toBe(true);
    expect(hasAnyFilter({ ...emptyFilter(), price: { max: 50000 } })).toBe(true);
  });
});

describe("removeMultiValue / clearRange — chip removal helpers", () => {
  it("removes one value from a multi-select array", () => {
    const f: VehicleFilter = { ...emptyFilter(), brands: ["audi", "bmw", "mercedes"] };
    const next = removeMultiValue(f, "brands", "bmw");
    expect(next.brands).toEqual(["audi", "mercedes"]);
  });

  it("returns same filter if value not present (referential equality)", () => {
    const f: VehicleFilter = { ...emptyFilter(), brands: ["audi"] };
    const next = removeMultiValue(f, "brands", "bmw");
    expect(next).toBe(f);
  });

  it("resets page to 1 when removing (filter changed → page invalid)", () => {
    const f: VehicleFilter = { ...emptyFilter(), brands: ["audi", "bmw"], page: 5 };
    expect(removeMultiValue(f, "brands", "audi").page).toBe(1);
  });

  it("clears a range entirely", () => {
    const f: VehicleFilter = { ...emptyFilter(), price: { min: 20000, max: 40000 } };
    const next = clearRange(f, "price");
    expect(next.price).toEqual({});
  });
});
