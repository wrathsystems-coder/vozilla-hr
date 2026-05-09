import { describe, expect, it } from "vitest";
import { qualityScore, scoreBreakdown } from "@/lib/lead-distribution/score";
import type { Weights } from "@/lib/lead-distribution/config";

const W: Weights = { w_response: 0.4, w_conversion: 0.3, w_rating: 0.2, w_capacity: 0.1 };

describe("qualityScore", () => {
  it("new dealer (all zeros) returns finite positive", () => {
    const score = qualityScore(
      {
        avg_response_time_hours: 0,
        conversion_rate: 0,
        avg_rating: 0,
        monthly_lead_cap: 0,
        current_month_leads: 0,
        throttle_factor: 1,
      },
      W,
    );
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThan(0);
  });

  it("response baseline: 24h fallback used when input is 0", () => {
    const breakdown = scoreBreakdown({ avg_response_time_hours: 0, throttle_factor: 1 }, W);
    // 1 / 24 * 0.4 ≈ 0.01667
    expect(breakdown.response).toBeCloseTo(0.4 / 24, 4);
  });

  it("response baseline NOT used when input is positive", () => {
    const breakdown = scoreBreakdown({ avg_response_time_hours: 2 }, W);
    // 1 / 2 * 0.4 = 0.2
    expect(breakdown.response).toBeCloseTo(0.2, 4);
  });

  it("rating normalised from 0-5 to 0-1 before weighting", () => {
    const fivestar = scoreBreakdown({ avg_rating: 5 }, W);
    expect(fivestar.rating).toBeCloseTo(0.2, 4); // (5/5) * 0.2

    const threestar = scoreBreakdown({ avg_rating: 3 }, W);
    expect(threestar.rating).toBeCloseTo(0.12, 4); // (3/5) * 0.2
  });

  it("over-capacity load ratio caps at 1 (capacity component goes to 0, not negative)", () => {
    const breakdown = scoreBreakdown({ monthly_lead_cap: 10, current_month_leads: 25 }, W);
    expect(breakdown.capacity).toBe(0);
  });

  it("throttle_factor multiplies the final score", () => {
    const full = qualityScore({ avg_rating: 5, throttle_factor: 1 }, W);
    const throttled = qualityScore({ avg_rating: 5, throttle_factor: 0.3 }, W);
    expect(throttled).toBeCloseTo(full * 0.3, 6);
  });

  it("throttle_factor=0 zeroes the score", () => {
    expect(qualityScore({ avg_rating: 5, throttle_factor: 0 }, W)).toBe(0);
  });

  it("breakdown components sum to raw and total = raw * throttle", () => {
    const b = scoreBreakdown(
      {
        avg_response_time_hours: 4,
        conversion_rate: 0.15,
        avg_rating: 4,
        monthly_lead_cap: 30,
        current_month_leads: 10,
        throttle_factor: 0.8,
      },
      W,
    );
    expect(b.raw).toBeCloseTo(b.response + b.conversion + b.rating + b.capacity, 6);
    expect(b.total).toBeCloseTo(b.raw * 0.8, 6);
  });
});
