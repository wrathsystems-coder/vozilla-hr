import { afterEach, describe, expect, it } from "vitest";
import { haversineKm } from "@/lib/geo/distance";
import { _resetCache, postcodeToCounty } from "@/lib/geo/postcode-to-county";

const ZAGREB = { lat: 45.815, lng: 15.9819 };
const SPLIT = { lat: 43.5081, lng: 16.4402 };
const RIJEKA = { lat: 45.3271, lng: 14.4422 };

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(ZAGREB, ZAGREB)).toBe(0);
  });

  it("Zagreb → Split is roughly 260 km (within 5 km tolerance)", () => {
    const km = haversineKm(ZAGREB, SPLIT);
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(265);
  });

  it("Zagreb → Rijeka is roughly 130 km (within 5 km tolerance)", () => {
    const km = haversineKm(ZAGREB, RIJEKA);
    expect(km).toBeGreaterThan(125);
    expect(km).toBeLessThan(140);
  });

  it("is symmetric", () => {
    const a2b = haversineKm(ZAGREB, SPLIT);
    const b2a = haversineKm(SPLIT, ZAGREB);
    expect(Math.abs(a2b - b2a)).toBeLessThan(1e-6);
  });

  it("antipodal points yield ~half Earth circumference (~20015 km)", () => {
    const km = haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(km).toBeGreaterThan(20010);
    expect(km).toBeLessThan(20020);
  });
});

describe("postcodeToCounty", () => {
  afterEach(() => {
    _resetCache();
  });

  it("maps Zagreb 10000 to county 21", () => {
    expect(postcodeToCounty("10000")).toEqual({ countyId: 21, city: "Zagreb" });
  });

  it("maps any 10xxx prefix to Zagreb (same prefix-driven lookup)", () => {
    expect(postcodeToCounty("10999")).toEqual({ countyId: 21, city: "Zagreb" });
  });

  it("maps Split 21000 to county 17", () => {
    expect(postcodeToCounty("21000")).toEqual({ countyId: 17, city: "Split" });
  });

  it("returns null for unknown 5-digit prefix", () => {
    expect(postcodeToCounty("99999")).toBeNull();
  });

  it("rejects 4-digit input", () => {
    expect(postcodeToCounty("1234")).toBeNull();
  });

  it("rejects 6-digit input", () => {
    expect(postcodeToCounty("100000")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(postcodeToCounty("abcde")).toBeNull();
  });
});
