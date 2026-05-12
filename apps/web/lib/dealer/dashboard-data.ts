import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Brand, Dealer, LeadAssignment, LeadRequest, Model } from "@/payload-types";

// Server-only data layer for the dealer dashboard. Two-step query (one
// find for the dealer's assignments, one find counting siblings by lead
// id) keeps us out of N+1 land — the dashboard is the chattiest dealer
// page, and we expect 20-100 assignments per dealer / month.

export type DashboardStats = {
  monthlyLeadCount: number;
  monthlyLeadCap: number;
  avgRating: number;
  avgResponseTimeHours: number;
  conversionRate: number;
};

export type DashboardAssignment = {
  id: number;
  leadId: number;
  displayId: string;
  customerName: string;
  customerCity: string | null;
  brand: string | null;
  model: string | null;
  priceMin: number | null;
  priceMax: number | null;
  timeFrame: string | null;
  status: LeadAssignment["status"];
  sentAt: string | null;
  viewedAt: string | null;
  contactedAt: string | null;
  closedAt: string | null;
  outcome: LeadAssignment["outcome"];
  competitorCount: number;
};

export function pickStats(dealer: Dealer): DashboardStats {
  const s = dealer.scoring ?? {};
  return {
    monthlyLeadCount: s.current_month_leads ?? 0,
    monthlyLeadCap: s.monthly_lead_cap ?? 0,
    avgRating: s.avg_rating ?? 0,
    avgResponseTimeHours: s.avg_response_time_hours ?? 0,
    conversionRate: s.conversion_rate ?? 0,
  };
}

export type FetchArgs = {
  dealerId: number;
  statusFilter?: LeadAssignment["status"] | "all";
  limit?: number;
};

export async function fetchDealerAssignments(args: FetchArgs): Promise<DashboardAssignment[]> {
  const payload = await getPayload({ config });

  // Payload's `Where` type is recursive — keep it as `any` here so we don't
  // re-derive the entire shape just to spell out two fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { dealer: { equals: args.dealerId } };
  if (args.statusFilter && args.statusFilter !== "all") {
    where.status = { equals: args.statusFilter };
  }

  // depth=1 pulls the related lead, which is itself depth=1-able for
  // brand/model. Setting depth=2 keeps the round-trip to one Payload call.
  const assignments = await payload.find({
    collection: "lead_assignments",
    where,
    sort: "-sent_at",
    limit: args.limit ?? 200,
    depth: 2,
  });

  const docs = assignments.docs as LeadAssignment[];

  // For competitor counts we need: for each unique lead, how many total
  // assignments exist (i.e. how many *other* dealers got the same lead).
  // One Payload find with the lead-id `in:` filter scales to the page size.
  const leadIds = Array.from(
    new Set(
      docs
        .map((a) => (typeof a.lead === "number" ? a.lead : (a.lead as LeadRequest | null)?.id))
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  const competitorCountByLead = new Map<number, number>();
  if (leadIds.length > 0) {
    const siblings = await payload.find({
      collection: "lead_assignments",
      where: { lead: { in: leadIds } },
      limit: leadIds.length * 10,
      depth: 0,
    });
    for (const a of siblings.docs as LeadAssignment[]) {
      const lid = typeof a.lead === "number" ? a.lead : (a.lead as LeadRequest | null)?.id;
      if (typeof lid !== "number") continue;
      competitorCountByLead.set(lid, (competitorCountByLead.get(lid) ?? 0) + 1);
    }
  }

  return docs.map((a) => {
    const lead = typeof a.lead === "number" ? null : (a.lead as LeadRequest | null);
    const brand = lead?.brand;
    const model = lead?.model;
    const leadId = typeof a.lead === "number" ? a.lead : ((lead?.id as number) ?? 0);
    const totalAssignments = competitorCountByLead.get(leadId) ?? 1;
    return {
      id: a.id as number,
      leadId,
      displayId: lead?.display_id ?? "",
      customerName: lead?.customer_name ?? "",
      customerCity: null,
      brand: brand && typeof brand !== "number" ? ((brand as Brand).name ?? null) : null,
      model: model && typeof model !== "number" ? ((model as Model).name ?? null) : null,
      priceMin: lead?.price_min ?? null,
      priceMax: lead?.price_max ?? null,
      timeFrame: lead?.time_frame ?? null,
      status: a.status,
      sentAt: a.sent_at ?? null,
      viewedAt: a.viewed_at ?? null,
      contactedAt: a.contacted_at ?? null,
      closedAt: a.closed_at ?? null,
      outcome: a.outcome ?? null,
      // -1 so the count reflects "other dealers", not the dealer themselves.
      competitorCount: Math.max(0, totalAssignments - 1),
    };
  });
}
