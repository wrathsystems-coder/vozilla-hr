import { haversineKm, type LatLng } from "@/lib/geo/distance";
import type { Rules, Weights } from "./config";
import { qualityScore, type ScoreInput } from "./score";

// Pure ranking algorithm. Carwow rule: the closest dealer is always
// included even if it doesn't make the top-N by quality score.
//
// Suspended / throttle=0 dealers are the caller's responsibility to filter
// before calling — they would still rank to 0 here and could squeeze out a
// real candidate. suggest.ts (Payload integration) handles the filter.

export type RankableDealer = ScoreInput & {
  id: number;
  lat: number;
  lng: number;
};

export type RankReason = "top_score" | "closest";

export type RankedDealer = {
  dealer: RankableDealer;
  qualityScore: number;
  distanceKm: number;
  /** 1-based rank in the returned list. */
  rank: number;
  isClosest: boolean;
  reason: RankReason;
};

export type RankResult = {
  suggested: RankedDealer[];
  warnings: string[];
};

export type RankOpts = {
  weights: Weights;
  rules: Rules;
  /** Maximum km from lead.lat/lng. Dealers outside the radius are dropped. */
  radiusKm: number;
};

export function rankDealers(dealers: RankableDealer[], lead: LatLng, opts: RankOpts): RankResult {
  const warnings: string[] = [];

  if (dealers.length === 0) {
    warnings.push("no_dealers_provided");
    return { suggested: [], warnings };
  }

  // 1. distance + score everyone, then drop those outside the radius.
  type Scored = {
    dealer: RankableDealer;
    distanceKm: number;
    qualityScore: number;
  };
  const inRadius: Scored[] = [];
  for (const dealer of dealers) {
    const distanceKm = haversineKm(lead, { lat: dealer.lat, lng: dealer.lng });
    if (distanceKm > opts.radiusKm) continue;
    inRadius.push({
      dealer,
      distanceKm,
      qualityScore: qualityScore(dealer, opts.weights),
    });
  }

  if (inRadius.length === 0) {
    warnings.push(`no_dealers_in_radius_${opts.radiusKm}km`);
    return { suggested: [], warnings };
  }

  // 2. Identify the closest (Carwow guarantee).
  const closest = inRadius.reduce((best, current) =>
    current.distanceKm < best.distanceKm ? current : best,
  );

  // 3. Top-N by quality score (descending). Tie-break: lower distance first
  // to keep rankings stable across runs with shifted weights.
  const byScore = [...inRadius].sort((a, b) => {
    if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
    return a.distanceKm - b.distanceKm;
  });

  const max = opts.rules.max_dealers_per_lead;
  let topByScore = byScore.slice(0, max);

  // 4. Carwow rule: insert closest if it isn't already in the top-N.
  if (
    opts.rules.closest_dealer_always_included &&
    !topByScore.some((s) => s.dealer.id === closest.dealer.id)
  ) {
    // Drop the lowest-ranked top-scorer to make room for the closest dealer.
    topByScore = [...topByScore.slice(0, max - 1), closest];
  }

  // 5. Final order: closest first (when promoted by Carwow rule), then
  // remaining by score. This matches the "Najbliži" badge UX from the spec.
  topByScore.sort((a, b) => {
    const aIsClosest = a.dealer.id === closest.dealer.id;
    const bIsClosest = b.dealer.id === closest.dealer.id;
    if (aIsClosest && !bIsClosest) return -1;
    if (bIsClosest && !aIsClosest) return 1;
    if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
    return a.distanceKm - b.distanceKm;
  });

  const suggested: RankedDealer[] = topByScore.map((s, idx) => {
    const isClosest = s.dealer.id === closest.dealer.id;
    // Reason: top_score by default; closest only when the Carwow rule
    // bumped a non-top-scorer in.
    const wouldHaveQualified = byScore.slice(0, max).some((b) => b.dealer.id === s.dealer.id);
    const reason: RankReason = isClosest && !wouldHaveQualified ? "closest" : "top_score";

    return {
      dealer: s.dealer,
      qualityScore: s.qualityScore,
      distanceKm: s.distanceKm,
      rank: idx + 1,
      isClosest,
      reason,
    };
  });

  if (suggested.length < opts.rules.min_dealers_per_lead) {
    warnings.push(
      `below_min_${opts.rules.min_dealers_per_lead}_only_${suggested.length}_in_radius`,
    );
  } else if (suggested.length < max) {
    warnings.push(`fewer_than_max_${max}_only_${suggested.length}_in_radius`);
  }

  return { suggested, warnings };
}
