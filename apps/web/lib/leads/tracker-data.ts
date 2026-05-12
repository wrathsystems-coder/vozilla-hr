import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Dealer, LeadAssignment, LeadRequest } from "@/payload-types";

// Read-side helper for /upit/[token]. Returns the lead + populated
// assignments (depth=1 so we get dealer name + city without an extra
// query). Caller has already validated the magic-link token.

export type TrackerAssignment = {
  id: number;
  dealerName: string;
  dealerCity: string | null;
  status: LeadAssignment["status"];
  sentAt: string | null;
  viewedAt: string | null;
  contactedAt: string | null;
  closedAt: string | null;
  outcome: LeadAssignment["outcome"] | null;
  markedInterested: boolean;
  markedNotInterested: boolean;
};

export type TrackerData = {
  lead: LeadRequest;
  assignments: TrackerAssignment[];
};

export async function loadTrackerData(leadId: number): Promise<TrackerData | null> {
  const payload = await getPayload({ config });
  let lead: LeadRequest;
  try {
    lead = (await payload.findByID({
      collection: "lead_requests",
      id: leadId,
      depth: 0,
    })) as LeadRequest;
  } catch {
    return null;
  }
  if (!lead) return null;

  const assignmentsResult = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: leadId } },
    depth: 1,
    limit: 50,
    sort: "sent_at",
  });

  const assignments: TrackerAssignment[] = (assignmentsResult.docs as LeadAssignment[]).map((a) => {
    const dealer = typeof a.dealer === "number" ? null : (a.dealer as Dealer);
    return {
      id: a.id,
      dealerName: dealer?.legal_name ?? "Diler",
      dealerCity: dealer?.address?.city ?? null,
      status: a.status,
      sentAt: a.sent_at ?? null,
      viewedAt: a.viewed_at ?? null,
      contactedAt: a.contacted_at ?? null,
      closedAt: a.closed_at ?? null,
      outcome: a.outcome ?? null,
      markedInterested: Boolean(a.customer_feedback?.marked_interested),
      markedNotInterested: Boolean(a.customer_feedback?.marked_not_interested),
    };
  });

  return { lead, assignments };
}
