import type { Weights } from "./config";

// Carwow-style quality_score. Spec: docs/spec/04-features-and-flows.md
// "Quality score formula".
//
// Defaults below kick in for new dealers (no leads yet → division by zero on
// 1/avg_response_time, no rating, etc.). They lean conservative so a fresh
// dealer ranks middle-of-the-pack rather than top: 24h baseline response,
// 20-lead/month default cap.

const FALLBACK_RESPONSE_HOURS = 24;
const FALLBACK_MONTHLY_CAP = 20;

export type ScoreInput = {
  avg_response_time_hours?: number | null;
  conversion_rate?: number | null;
  /** 0–5 stars; we normalise to 0–1 internally. */
  avg_rating?: number | null;
  monthly_lead_cap?: number | null;
  current_month_leads?: number | null;
  /** Multiplier applied to final score. 1.0 = normal, 0.3 = throttled, 0 = suspended. */
  throttle_factor?: number | null;
};

export type ScoreBreakdown = {
  response: number;
  conversion: number;
  rating: number;
  capacity: number;
  /** Sum of weighted components, before throttle. */
  raw: number;
  throttle: number;
  /** raw * throttle. */
  total: number;
};

export function qualityScore(input: ScoreInput, weights: Weights): number {
  return scoreBreakdown(input, weights).total;
}

export function scoreBreakdown(input: ScoreInput, weights: Weights): ScoreBreakdown {
  const responseHours =
    input.avg_response_time_hours && input.avg_response_time_hours > 0
      ? input.avg_response_time_hours
      : FALLBACK_RESPONSE_HOURS;
  const conversion = input.conversion_rate ?? 0;
  const ratingNormalised = (input.avg_rating ?? 0) / 5;
  const cap =
    input.monthly_lead_cap && input.monthly_lead_cap > 0
      ? input.monthly_lead_cap
      : FALLBACK_MONTHLY_CAP;
  const used = input.current_month_leads ?? 0;
  // Cap load ratio at 1 — over-capacity dealers get 0 capacity score, not negative.
  const loadRatio = Math.min(1, used / cap);
  const capacity = 1 - loadRatio;

  const responseComponent = (1 / responseHours) * weights.w_response;
  const conversionComponent = conversion * weights.w_conversion;
  const ratingComponent = ratingNormalised * weights.w_rating;
  const capacityComponent = capacity * weights.w_capacity;

  const raw = responseComponent + conversionComponent + ratingComponent + capacityComponent;
  const throttle = input.throttle_factor ?? 1.0;

  return {
    response: responseComponent,
    conversion: conversionComponent,
    rating: ratingComponent,
    capacity: capacityComponent,
    raw,
    throttle,
    total: raw * throttle,
  };
}
