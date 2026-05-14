import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Dealer, LeadAssignment, LeadRequest } from "@/payload-types";
import { logAudit } from "@/lib/audit-log";
import { dispatch } from "@/lib/email/dispatch";
import { siteUrl } from "@/lib/seo/site-url";
import { now } from "@/lib/utils/time";

// Spec: docs/spec/04-features-and-flows.md "TOK 3 — Diler prima lead".
// Inserts one lead_assignment per selected dealer (skipping pre-existing
// pairs since LeadAssignments enforces (lead, dealer) uniqueness at the
// app layer), bumps each dealer's monthly counter, transitions the lead
// to status='sent', dispatches lead-to-dealer emails, writes the audit
// row. competitorCount in each email = (selected.length - 1) — Carwow
// "lead poslan još N dilerima" transparency.

const DEFAULT_RESPONSE_DEADLINE_HOURS = 48;

export type DispatchInput = {
  leadId: number;
  dealerSelections: Array<{
    dealerId: number;
    qualityScoreAtDispatch: number | null;
  }>;
  actorAdminId: string;
  ipAddress?: string | null;
  responseDeadlineHours?: number;
};

export type DispatchOutcome = {
  ok: boolean;
  assignmentsCreated: number;
  assignmentsSkipped: number;
  emailsDispatched: number;
  errors: string[];
};

export async function dispatchToDealers(input: DispatchInput): Promise<DispatchOutcome> {
  const errors: string[] = [];
  if (input.dealerSelections.length === 0) {
    return {
      ok: false,
      assignmentsCreated: 0,
      assignmentsSkipped: 0,
      emailsDispatched: 0,
      errors: ["no_dealers_selected"],
    };
  }

  const payload = await getPayload({ config });

  let lead: LeadRequest;
  try {
    lead = (await payload.findByID({
      collection: "lead_requests",
      id: input.leadId,
      depth: 1,
    })) as LeadRequest;
  } catch {
    return {
      ok: false,
      assignmentsCreated: 0,
      assignmentsSkipped: 0,
      emailsDispatched: 0,
      errors: ["lead_not_found"],
    };
  }
  if (lead.status === "closed") {
    return {
      ok: false,
      assignmentsCreated: 0,
      assignmentsSkipped: 0,
      emailsDispatched: 0,
      errors: ["lead_closed"],
    };
  }

  // Check existing assignments so we don't violate the (lead, dealer)
  // uniqueness rule on a re-dispatch (admin re-opens the page and clicks
  // send again). Existing pairs are skipped, not errored — idempotency
  // makes the page safe to retry.
  const existing = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: input.leadId } },
    limit: 200,
    depth: 0,
  });
  const existingDealerIds = new Set(
    (existing.docs as LeadAssignment[]).map((a) =>
      typeof a.dealer === "number" ? a.dealer : a.dealer?.id,
    ),
  );

  const created: Array<{ dealer: Dealer; qualityScore: number | null }> = [];
  const sentAt = now().toISOString();

  for (const selection of input.dealerSelections) {
    if (existingDealerIds.has(selection.dealerId)) continue;

    let dealer: Dealer;
    try {
      dealer = (await payload.findByID({
        collection: "dealers",
        id: selection.dealerId,
        depth: 0,
      })) as Dealer;
    } catch {
      errors.push(`dealer_${selection.dealerId}_not_found`);
      continue;
    }
    if (!dealer.is_active) {
      errors.push(`dealer_${selection.dealerId}_inactive`);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentData: any = {
      lead: input.leadId,
      dealer: selection.dealerId,
      status: "sent",
      sent_at: sentAt,
      quality_score_at_dispatch: selection.qualityScoreAtDispatch,
    };
    try {
      await payload.create({
        collection: "lead_assignments",
        overrideAccess: true,
        data: assignmentData,
      });
    } catch (err) {
      errors.push(
        `assignment_create_failed_${selection.dealerId}_${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }

    // Increment the dealer's monthly counter so the score capacity
    // component degrades immediately. Sprint 5 cron resets it monthly.
    const currentLoad = (dealer.scoring?.current_month_leads as number | undefined) ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dealerScoringPatch: any = {
      scoring: { ...(dealer.scoring ?? {}), current_month_leads: currentLoad + 1 },
    };
    try {
      await payload.update({
        collection: "dealers",
        id: selection.dealerId,
        overrideAccess: true,
        data: dealerScoringPatch,
      });
    } catch (err) {
      errors.push(
        `dealer_counter_update_failed_${selection.dealerId}_${err instanceof Error ? err.message : String(err)}`,
      );
    }

    created.push({ dealer, qualityScore: selection.qualityScoreAtDispatch });
  }

  // Transition lead status only if at least one dealer made it through.
  if (created.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadPatch: any = { status: "sent" };
    await payload.update({
      collection: "lead_requests",
      id: input.leadId,
      overrideAccess: true,
      data: leadPatch,
    });
  }

  // Dispatch lead-to-dealer emails. competitorCount counts only the
  // dealers we actually queued this round (skipped duplicates aren't
  // notified twice).
  const competitorCount = Math.max(0, created.length - 1);
  const brandRel = lead.brand;
  const brand =
    brandRel && typeof brandRel !== "number"
      ? ((brandRel as { name?: string }).name ?? null)
      : null;
  const modelRel = lead.model;
  const model =
    modelRel && typeof modelRel !== "number"
      ? ((modelRel as { name?: string }).name ?? null)
      : null;
  const dashboardBase = `${siteUrl()}/partneri/lead`;

  let emailsDispatched = 0;
  for (const c of created) {
    try {
      await dispatch({
        key: "lead-to-dealer",
        to: (c.dealer.email as string | undefined) ?? "",
        props: {
          dealerName: (c.dealer.legal_name as string | undefined) ?? "Diler",
          displayId: lead.display_id as string,
          brand,
          model,
          versionText: lead.version_text ?? null,
          priceMin: lead.price_min ?? null,
          priceMax: lead.price_max ?? null,
          financingType: lead.financing_type ?? null,
          hasTradeIn: Boolean(lead.has_trade_in),
          timeFrame: lead.time_frame ?? null,
          customerName: lead.customer_name as string,
          customerPhone: lead.customer_phone as string,
          customerEmail: lead.customer_email as string,
          customerCounty: null,
          customerPostcode: lead.customer_postcode as string,
          preferredContactMethod: (lead.preferred_contact_method as string) ?? "any",
          bestContactTime: lead.best_contact_time ?? null,
          competitorCount,
          dashboardUrl: `${dashboardBase}/${input.leadId}`,
          responseDeadlineHours: input.responseDeadlineHours ?? DEFAULT_RESPONSE_DEADLINE_HOURS,
        },
      });
      emailsDispatched++;
    } catch (err) {
      errors.push(
        `email_dispatch_failed_${c.dealer.id}_${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  await logAudit({
    actorType: "admin",
    actorId: input.actorAdminId,
    action: "lead.dispatch_to_dealers",
    entityType: "lead_request",
    entityId: input.leadId,
    before: { status: lead.status },
    after: {
      status: created.length > 0 ? "sent" : lead.status,
      dealer_ids: created.map((c) => c.dealer.id),
      assignments_created: created.length,
      emails_dispatched: emailsDispatched,
    },
    ipAddress: input.ipAddress ?? null,
  });

  return {
    ok: errors.length === 0 && created.length > 0,
    assignmentsCreated: created.length,
    assignmentsSkipped: input.dealerSelections.length - created.length,
    emailsDispatched,
    errors,
  };
}
