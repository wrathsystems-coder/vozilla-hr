import { describe, expect, it } from "vitest";
import { rankDealers, type RankableDealer } from "@/lib/lead-distribution/rank";
import type { Rules, Weights } from "@/lib/lead-distribution/config";

const ZAGREB = { lat: 45.815, lng: 15.9819 };
const SPLIT = { lat: 43.5081, lng: 16.4402 };
const RIJEKA = { lat: 45.3271, lng: 14.4422 };
const ZADAR = { lat: 44.1194, lng: 15.2314 };
const OSIJEK = { lat: 45.555, lng: 18.6955 };
const PULA = { lat: 44.8666, lng: 13.8496 };
const DUBROVNIK = { lat: 42.6507, lng: 18.0944 };

const WEIGHTS: Weights = { w_response: 0.4, w_conversion: 0.3, w_rating: 0.2, w_capacity: 0.1 };
const RULES: Rules = {
  closest_dealer_always_included: true,
  max_dealers_per_lead: 5,
  default_dealers_per_lead: 5,
  min_dealers_per_lead: 3,
};

function makeDealer(
  id: number,
  loc: { lat: number; lng: number },
  scoreFields: Partial<RankableDealer> = {},
): RankableDealer {
  return {
    id,
    lat: loc.lat,
    lng: loc.lng,
    avg_response_time_hours: 4,
    conversion_rate: 0.1,
    avg_rating: 4,
    monthly_lead_cap: 20,
    current_month_leads: 5,
    throttle_factor: 1,
    ...scoreFields,
  };
}

describe("rankDealers", () => {
  it("empty dealer list returns empty + warning", () => {
    const result = rankDealers([], ZAGREB, { weights: WEIGHTS, rules: RULES, radiusKm: 100 });
    expect(result.suggested).toEqual([]);
    expect(result.warnings).toContain("no_dealers_provided");
  });

  it("all dealers outside radius → empty + warning", () => {
    const result = rankDealers([makeDealer(1, SPLIT), makeDealer(2, DUBROVNIK)], ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 50,
    });
    expect(result.suggested).toEqual([]);
    expect(result.warnings[0]).toMatch(/^no_dealers_in_radius_/);
  });

  it("returns all dealers when fewer than max in radius", () => {
    const result = rankDealers([makeDealer(1, ZAGREB), makeDealer(2, RIJEKA)], ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 200,
    });
    expect(result.suggested).toHaveLength(2);
    expect(result.warnings.some((w) => w.startsWith("below_min_3"))).toBe(true);
  });

  it("caps at max_dealers_per_lead", () => {
    const dealers = [
      makeDealer(1, ZAGREB),
      makeDealer(2, ZAGREB),
      makeDealer(3, RIJEKA),
      makeDealer(4, ZADAR),
      makeDealer(5, OSIJEK),
      makeDealer(6, PULA),
    ];
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 500,
    });
    expect(result.suggested).toHaveLength(5);
  });

  it("ranks list with rank=1..N and reason='top_score' when closest is also top scorer", () => {
    // High-score dealer in Zagreb is closest AND best — Carwow rule doesn't displace anyone.
    const dealers = [
      makeDealer(1, ZAGREB, { avg_response_time_hours: 1, avg_rating: 5 }), // best + closest
      makeDealer(2, RIJEKA, { avg_response_time_hours: 8 }),
      makeDealer(3, ZADAR, { avg_response_time_hours: 12 }),
    ];
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 500,
    });
    expect(result.suggested[0].dealer.id).toBe(1);
    expect(result.suggested[0].isClosest).toBe(true);
    expect(result.suggested[0].reason).toBe("top_score");
    expect(result.suggested.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it("Carwow rule: closest non-top-scorer is promoted into the list", () => {
    // 6 strong dealers far from lead, 1 weak dealer right next door.
    // Without the rule, the close dealer wouldn't qualify.
    const farButStrong = (id: number, loc: typeof ZAGREB) =>
      makeDealer(id, loc, { avg_response_time_hours: 1, avg_rating: 5, conversion_rate: 0.3 });
    const dealers = [
      farButStrong(1, RIJEKA),
      farButStrong(2, ZADAR),
      farButStrong(3, OSIJEK),
      farButStrong(4, PULA),
      farButStrong(5, SPLIT),
      makeDealer(6, ZAGREB, { avg_response_time_hours: 48, avg_rating: 2 }), // weak but closest
    ];
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 500,
    });
    expect(result.suggested).toHaveLength(5);
    const closestEntry = result.suggested.find((s) => s.dealer.id === 6);
    expect(closestEntry).toBeDefined();
    expect(closestEntry!.reason).toBe("closest");
    expect(closestEntry!.isClosest).toBe(true);
    // Closest is sorted to position 1 for the "Najbliži" badge.
    expect(result.suggested[0].dealer.id).toBe(6);
  });

  it("closest_dealer_always_included=false: top-N by score regardless of distance", () => {
    const farStrong = (id: number, loc: typeof ZAGREB) =>
      makeDealer(id, loc, { avg_response_time_hours: 1, avg_rating: 5 });
    const dealers = [
      farStrong(1, RIJEKA),
      farStrong(2, ZADAR),
      farStrong(3, OSIJEK),
      farStrong(4, PULA),
      farStrong(5, SPLIT),
      makeDealer(6, ZAGREB, { avg_response_time_hours: 48, avg_rating: 2 }),
    ];
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: { ...RULES, closest_dealer_always_included: false },
      radiusKm: 500,
    });
    // All 5 top scorers are far; the close weak dealer is excluded.
    expect(result.suggested.find((s) => s.dealer.id === 6)).toBeUndefined();
  });

  it("computes distance correctly for each suggested dealer", () => {
    const result = rankDealers([makeDealer(1, ZAGREB), makeDealer(2, RIJEKA)], ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 500,
    });
    const zg = result.suggested.find((s) => s.dealer.id === 1)!;
    const rj = result.suggested.find((s) => s.dealer.id === 2)!;
    expect(zg.distanceKm).toBeLessThan(1);
    expect(rj.distanceKm).toBeGreaterThan(125);
    expect(rj.distanceKm).toBeLessThan(140);
  });

  it("ties broken by distance ascending (deterministic order under shifting weights)", () => {
    const dealers = [
      makeDealer(1, RIJEKA), // farther
      makeDealer(2, ZAGREB), // closer
    ];
    // Identical scoring → distance is the tie-breaker.
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: { ...RULES, max_dealers_per_lead: 1, min_dealers_per_lead: 1 },
      radiusKm: 500,
    });
    expect(result.suggested[0].dealer.id).toBe(2);
  });

  it("warns 'fewer_than_max' when in_radius < max but >= min", () => {
    const dealers = [makeDealer(1, ZAGREB), makeDealer(2, RIJEKA), makeDealer(3, ZADAR)];
    const result = rankDealers(dealers, ZAGREB, {
      weights: WEIGHTS,
      rules: RULES,
      radiusKm: 500,
    });
    expect(result.suggested).toHaveLength(3);
    expect(result.warnings.some((w) => w.startsWith("fewer_than_max_5"))).toBe(true);
    expect(result.warnings.some((w) => w.startsWith("below_min_"))).toBe(false);
  });
});
