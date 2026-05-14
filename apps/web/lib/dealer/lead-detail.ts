import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Brand, Dealer, LeadAssignment, LeadRequest, Model } from "@/payload-types";

// Loads everything the dealer's /partneri/lead/[id] page needs:
//   - the lead (any dealer can theoretically see basic info, but we gate
//     access via the existence of an assignment row for this dealer)
//   - this dealer's assignment (or null → 404)
//   - sibling-assignment count for the "konkurencija" sidebar
//   - response-rank-after-close: if the dealer has closed this lead, what
//     was their contacted_at ordering among everyone who contacted?
//     Surfaces the Carwow "Tvoj odgovor je bio 2. od 5 po brzini" copy.

export type LeadDetail = {
  lead: LeadRequest;
  assignment: LeadAssignment;
  competitorCount: number;
  brand: string | null;
  model: string | null;
  responseRank: { rank: number; total: number } | null;
};

export async function loadLeadDetailForDealer(
  leadId: number,
  dealerId: number,
): Promise<LeadDetail | null> {
  const payload = await getPayload({ config });

  let lead: LeadRequest;
  try {
    lead = (await payload.findByID({
      collection: "lead_requests",
      id: leadId,
      depth: 1,
    })) as LeadRequest;
  } catch {
    return null;
  }
  if (!lead) return null;

  const assignmentsResult = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: leadId } },
    limit: 50,
    depth: 0,
  });
  const allAssignments = assignmentsResult.docs as LeadAssignment[];
  const mine = allAssignments.find(
    (a) => (typeof a.dealer === "number" ? a.dealer : (a.dealer as Dealer | null)?.id) === dealerId,
  );
  if (!mine) return null;

  const competitorCount = Math.max(0, allAssignments.length - 1);

  const brandRel = lead.brand;
  const modelRel = lead.model;
  const brand =
    brandRel && typeof brandRel !== "number" ? ((brandRel as Brand).name ?? null) : null;
  const model =
    modelRel && typeof modelRel !== "number" ? ((modelRel as Model).name ?? null) : null;

  // Response-rank: only meaningful once this dealer has actually contacted
  // the customer. Among all assignments with contacted_at set, sort
  // ascending — the dealer who reached out first is #1.
  let responseRank: { rank: number; total: number } | null = null;
  if (mine.contacted_at) {
    const contacted = allAssignments.filter((a) => a.contacted_at);
    contacted.sort(
      (a, b) =>
        new Date(a.contacted_at as string).getTime() - new Date(b.contacted_at as string).getTime(),
    );
    const idx = contacted.findIndex(
      (a) =>
        (typeof a.dealer === "number" ? a.dealer : (a.dealer as Dealer | null)?.id) === dealerId,
    );
    if (idx >= 0) {
      responseRank = { rank: idx + 1, total: allAssignments.length };
    }
  }

  return { lead, assignment: mine, competitorCount, brand, model, responseRank };
}
