import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Dealer } from "@/payload-types";
import { loadLeadDistributionConfig } from "./config";
import { rankDealers, type RankableDealer, type RankResult } from "./rank";

// Payload-integrated wrapper around rankDealers. Loads active+verified
// dealers (filtered by brand if provided), maps them to RankableDealer
// shape, then defers to the pure ranking algorithm in rank.ts.
//
// We deliberately don't unstable_cache here: dealer scoring fields move
// every time admin sends a lead (current_month_leads++) so cache hits
// would surface stale rankings inside a single workday. Cold-call cost
// is ~50-100ms per dispatch — acceptable.

export type SuggestArgs = {
  lead: { lat: number; lng: number; brandId?: number | null };
  radiusKm?: number;
};

export async function suggestDealersForLead(args: SuggestArgs): Promise<RankResult> {
  const cfg = loadLeadDistributionConfig();
  const radiusKm = args.radiusKm ?? 100;

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "dealers",
    where: {
      and: [
        { is_active: { equals: true } },
        { "scoring.throttle_factor": { greater_than: 0 } },
        ...(args.lead.brandId ? [{ brands: { contains: args.lead.brandId } }] : []),
      ],
    },
    depth: 0,
    limit: 500,
  });

  const rankable: RankableDealer[] = [];
  for (const raw of result.docs as Dealer[]) {
    const lat = raw.address?.lat;
    const lng = raw.address?.lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    rankable.push({
      id: raw.id,
      lat,
      lng,
      avg_response_time_hours: raw.scoring?.avg_response_time_hours ?? null,
      conversion_rate: raw.scoring?.conversion_rate ?? null,
      avg_rating: raw.scoring?.avg_rating ?? null,
      monthly_lead_cap: raw.scoring?.monthly_lead_cap ?? null,
      current_month_leads: raw.scoring?.current_month_leads ?? null,
      throttle_factor: raw.scoring?.throttle_factor ?? null,
    });
  }

  return rankDealers(rankable, args.lead, {
    weights: cfg.weights,
    rules: cfg.rules,
    radiusKm,
  });
}
