import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { dispatch } from "@/lib/email/dispatch";
import { siteUrl } from "@/lib/seo/site-url";
import { now } from "@/lib/utils/time";
import type { Brand, LeadAssignment, LeadRequest, Model } from "@/payload-types";

// Day 3 / 14 / 30 customer feedback sweep. Runs daily (Vercel cron).
//
// Decision rules (catch-up semantics — we don't backfill day3 if we're
// past day 14 already, just send the most recent eligible day):
//   daysOld in [3, 14)  → send day3 if !day3Sent
//   daysOld in [14, 30) → send day14 if !day14Sent (skip day3 even if missed)
//   daysOld >= 30       → send day30 if !day30Sent (skip earlier if missed)
//
// Stops on:
//   - status != 'sent' (closed / canceled leads stop chasing)
//   - customer_feedback_emails.disabled = true (admin opt-out switch)
//   - Email already sent for the eligible day (idempotency gate)

const DAY_MS = 24 * 60 * 60 * 1000;

export const FEEDBACK_DAY_3 = 3;
export const FEEDBACK_DAY_14 = 14;
export const FEEDBACK_DAY_30 = 30;

export type FeedbackDay = "day3" | "day14" | "day30";

export type SentMap = {
  day3SentAt: Date | null;
  day14SentAt: Date | null;
  day30SentAt: Date | null;
};

export type FeedbackTickResult = {
  scanned: number;
  sent: { day3: number; day14: number; day30: number };
  skipped: number;
  errors: string[];
};

/**
 * Pure decision function. Returns which feedback day (if any) to send
 * for a lead given its age and the already-sent ledger.
 *
 * Catch-up semantics: a lead that's 20 days old and hasn't received any
 * feedback email yet gets day14 (current window), not day3 (overdue). The
 * 30-day retention boundary makes "backfill day3 four weeks late" feel
 * like a bug to the customer — they're past that mental window.
 */
export function pickFeedbackDay(
  createdAt: Date,
  currentTime: Date,
  sent: SentMap,
  disabled: boolean,
): FeedbackDay | null {
  if (disabled) return null;
  const daysOld = (currentTime.getTime() - createdAt.getTime()) / DAY_MS;
  if (daysOld < FEEDBACK_DAY_3) return null;
  if (daysOld < FEEDBACK_DAY_14) {
    return sent.day3SentAt ? null : "day3";
  }
  if (daysOld < FEEDBACK_DAY_30) {
    return sent.day14SentAt ? null : "day14";
  }
  return sent.day30SentAt ? null : "day30";
}

function vehicleLabel(lead: LeadRequest): string {
  const brand =
    typeof lead.brand === "number" ? null : ((lead.brand as Brand | null)?.name as string | null);
  const model =
    typeof lead.model === "number" ? null : ((lead.model as Model | null)?.name as string | null);
  return [brand, model].filter(Boolean).join(" ");
}

export async function runCustomerFeedbackTick(): Promise<FeedbackTickResult> {
  const payload = await getPayload({ config });
  const errors: string[] = [];
  const result: FeedbackTickResult = {
    scanned: 0,
    sent: { day3: 0, day14: 0, day30: 0 },
    skipped: 0,
    errors,
  };

  const ts = now();
  // 3-day lower bound — leads younger than this can't be due for day3
  // yet. Upper bound is open: day30 is the last touchpoint and we don't
  // chase past that. 500-lead cap matches dealer-reminders for cron
  // budget consistency.
  const cutoffDay3 = new Date(ts.getTime() - FEEDBACK_DAY_3 * DAY_MS);

  const open = await payload.find({
    collection: "lead_requests",
    where: {
      and: [
        { status: { equals: "sent" } },
        { createdAt: { less_than_equal: cutoffDay3.toISOString() } },
        { "customer_feedback_emails.disabled": { not_equals: true } },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    depth: 1,
    limit: 500,
    sort: "createdAt",
  });

  const docs = open.docs as LeadRequest[];
  result.scanned = docs.length;
  if (docs.length === 0) return result;

  // Batch competitor count fetch: count of distinct assignments per lead
  // (drives "x dealers were contacted" copy on day3 template).
  const leadIds = docs.map((l) => l.id as number);
  const dealerCounts = await fetchDealerCountsByLead(payload, leadIds);

  for (const lead of docs) {
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
    if (!createdAt) {
      result.skipped += 1;
      continue;
    }

    const day = pickFeedbackDay(
      createdAt,
      ts,
      {
        day3SentAt: lead.customer_feedback_emails?.day3_sent_at
          ? new Date(lead.customer_feedback_emails.day3_sent_at)
          : null,
        day14SentAt: lead.customer_feedback_emails?.day14_sent_at
          ? new Date(lead.customer_feedback_emails.day14_sent_at)
          : null,
        day30SentAt: lead.customer_feedback_emails?.day30_sent_at
          ? new Date(lead.customer_feedback_emails.day30_sent_at)
          : null,
      },
      Boolean(lead.customer_feedback_emails?.disabled),
    );
    if (!day) {
      result.skipped += 1;
      continue;
    }

    const email = (lead.customer_email as string | undefined) ?? "";
    // Anonymised leads (post-cancel) have a deleted-… mailbox at
    // @vozilla.invalid. cancelLead sets status='closed' which the
    // where-clause already excludes, but keep the belt-and-suspenders
    // check in case admin manually reopens.
    if (!email || email.startsWith("deleted-")) {
      result.skipped += 1;
      continue;
    }

    try {
      await sendFeedback(payload, lead, day, dealerCounts.get(lead.id as number) ?? 0, ts);
      result.sent[day] += 1;
    } catch (err) {
      errors.push(
        `${day}_failed_lead_${lead.id}_${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}

async function fetchDealerCountsByLead(
  payload: Awaited<ReturnType<typeof getPayload>>,
  leadIds: number[],
): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (leadIds.length === 0) return out;
  const siblings = await payload.find({
    collection: "lead_assignments",
    where: { lead: { in: leadIds } },
    depth: 0,
    limit: leadIds.length * 10,
  });
  for (const a of siblings.docs as LeadAssignment[]) {
    const lid = typeof a.lead === "number" ? a.lead : (a.lead as LeadRequest | null)?.id;
    if (typeof lid !== "number") continue;
    out.set(lid, (out.get(lid) ?? 0) + 1);
  }
  return out;
}

async function sendFeedback(
  payload: Awaited<ReturnType<typeof getPayload>>,
  lead: LeadRequest,
  day: FeedbackDay,
  dealerCount: number,
  ts: Date,
): Promise<void> {
  const trackerUrl = `${siteUrl()}/upit/${lead.public_token as string}`;
  const displayId = (lead.display_id as string | undefined) ?? `#${lead.id}`;
  const customerName = (lead.customer_name as string | undefined) ?? "";
  const email = (lead.customer_email as string | undefined) ?? "";
  const vehicle = vehicleLabel(lead);

  if (day === "day3") {
    await dispatch({
      key: "customer-feedback-3d",
      to: email,
      props: { customerName, displayId, trackerUrl, vehicleLabel: vehicle, dealerCount },
    });
  } else if (day === "day14") {
    await dispatch({
      key: "customer-feedback-14d",
      to: email,
      props: { customerName, displayId, trackerUrl, vehicleLabel: vehicle },
    });
  } else {
    await dispatch({
      key: "customer-feedback-30d",
      to: email,
      props: { customerName, displayId, trackerUrl, vehicleLabel: vehicle },
    });
  }

  const columnKey =
    day === "day3" ? "day3_sent_at" : day === "day14" ? "day14_sent_at" : "day30_sent_at";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    customer_feedback_emails: {
      ...(lead.customer_feedback_emails ?? {}),
      [columnKey]: ts.toISOString(),
    },
  };
  await payload.update({
    collection: "lead_requests",
    id: lead.id as number,
    overrideAccess: true,
    data: patch,
  });

  await logAudit({
    actorType: "system",
    action: `lead.customer_feedback_${day}_sent`,
    entityType: "lead_request",
    entityId: lead.id,
    after: { display_id: displayId },
  });
}
