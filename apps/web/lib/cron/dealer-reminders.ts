import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { dispatch } from "@/lib/email/dispatch";
import { siteUrl } from "@/lib/seo/site-url";
import { now } from "@/lib/utils/time";
import type { Brand, Dealer, LeadAssignment, LeadRequest, Model } from "@/payload-types";

// 24h / 48h / 72h sweep over open lead_assignments. Runs hourly via
// Vercel Cron (vercel.json). Each assignment can fire at most one
// reminder per stage (first_reminder_sent_at + second_reminder_sent_at
// gate idempotency — re-running the cron within the hour is safe).
// 72h flips reminders.expired_no_response and writes an audit row;
// Sprint 7 polish hooks a heavier response-time degradation here.

const HOUR_MS = 60 * 60 * 1000;
const FIRST_REMINDER_HOURS = 24;
const SECOND_REMINDER_HOURS = 48;
const EXPIRE_HOURS = 72;

export type ReminderTickResult = {
  scanned: number;
  remindersSent: { first: number; second: number };
  expired: number;
  errors: string[];
};

type Eligibility = "none" | "send_first" | "send_second" | "expire";

/**
 * Pure decision function: given an assignment's sent-at + reminder state +
 * the current time, what's the *highest-tier* action we should take
 * this tick? Returning "send_second" implies that first has already fired
 * (or won't fire — we don't double-send a stage that was overshot).
 */
export function pickAction(
  sentAt: Date,
  currentTime: Date,
  firstSentAt: Date | null,
  secondSentAt: Date | null,
  alreadyExpired: boolean,
  status: LeadAssignment["status"],
): Eligibility {
  if (alreadyExpired) return "none";
  // Once the dealer has actively engaged (contacted) or the lead is closed,
  // we stop chasing — even if the 24/48/72h thresholds are crossed.
  if (status === "contacted" || status === "closed") return "none";

  const hours = (currentTime.getTime() - sentAt.getTime()) / HOUR_MS;
  if (hours >= EXPIRE_HOURS) return "expire";
  if (hours >= SECOND_REMINDER_HOURS && !secondSentAt) return "send_second";
  if (hours >= FIRST_REMINDER_HOURS && !firstSentAt) return "send_first";
  return "none";
}

export async function runDealerRemindersTick(): Promise<ReminderTickResult> {
  const payload = await getPayload({ config });
  const errors: string[] = [];
  const result: ReminderTickResult = {
    scanned: 0,
    remindersSent: { first: 0, second: 0 },
    expired: 0,
    errors,
  };

  // Pull all open assignments (status 'sent' or 'viewed', sent_at set).
  // Cap at 500 per tick — way past expected throughput, keeps the cron
  // bounded so a backlog can't blow past Vercel's 60s limit.
  const open = await payload.find({
    collection: "lead_assignments",
    where: {
      and: [{ status: { in: ["sent", "viewed"] } }, { sent_at: { exists: true } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    depth: 2,
    limit: 500,
    sort: "sent_at",
  });

  const ts = now();

  // Pre-fetch sibling counts so the reminder emails carry the right
  // competitor count. One Payload find for all lead IDs we're processing.
  const docs = open.docs as LeadAssignment[];
  result.scanned = docs.length;

  const leadIds = Array.from(
    new Set(
      docs
        .map((a) => (typeof a.lead === "number" ? a.lead : (a.lead as LeadRequest | null)?.id))
        .filter((id): id is number => typeof id === "number"),
    ),
  );
  const competitorCountByLead = await fetchCompetitorCounts(payload, leadIds);

  for (const assignment of docs) {
    const sentAt = assignment.sent_at ? new Date(assignment.sent_at) : null;
    if (!sentAt) continue;
    const action = pickAction(
      sentAt,
      ts,
      assignment.reminders?.first_reminder_sent_at
        ? new Date(assignment.reminders.first_reminder_sent_at)
        : null,
      assignment.reminders?.second_reminder_sent_at
        ? new Date(assignment.reminders.second_reminder_sent_at)
        : null,
      Boolean(assignment.reminders?.expired_no_response),
      assignment.status,
    );
    if (action === "none") continue;

    try {
      if (action === "send_first") {
        await handleFirstReminder(payload, assignment, ts, competitorCountByLead);
        result.remindersSent.first += 1;
      } else if (action === "send_second") {
        await handleSecondReminder(payload, assignment, ts, competitorCountByLead);
        result.remindersSent.second += 1;
      } else if (action === "expire") {
        await handleExpire(payload, assignment, ts);
        result.expired += 1;
      }
    } catch (err) {
      errors.push(
        `${action}_failed_assignment_${assignment.id}_${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}

async function fetchCompetitorCounts(
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

async function handleFirstReminder(
  payload: Awaited<ReturnType<typeof getPayload>>,
  assignment: LeadAssignment,
  ts: Date,
  competitorCountByLead: Map<number, number>,
): Promise<void> {
  const dealer =
    typeof assignment.dealer === "number" ? null : (assignment.dealer as Dealer | null);
  const lead = typeof assignment.lead === "number" ? null : (assignment.lead as LeadRequest | null);
  if (!dealer || !lead) return;

  const leadId = typeof assignment.lead === "number" ? assignment.lead : (lead.id as number);
  const competitorCount = Math.max(0, (competitorCountByLead.get(leadId) ?? 1) - 1);
  const hoursSinceSent = (ts.getTime() - new Date(assignment.sent_at!).getTime()) / HOUR_MS;

  await dispatch({
    key: "dealer-reminder-1",
    to: (dealer.email as string | undefined) ?? "",
    props: {
      dealerName: (dealer.legal_name as string | undefined) ?? "Partner",
      displayId: (lead.display_id as string | undefined) ?? `#${leadId}`,
      vehicle: vehicleLabel(lead),
      customerName: (lead.customer_name as string | undefined) ?? "",
      competitorCount,
      dashboardUrl: `${siteUrl()}/partneri/lead/${leadId}`,
      hoursSinceSent,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    reminders: { ...(assignment.reminders ?? {}), first_reminder_sent_at: ts.toISOString() },
  };
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    data: patch,
  });

  await logAudit({
    actorType: "system",
    action: "lead_assignment.reminder_1_sent",
    entityType: "lead_assignment",
    entityId: assignment.id,
    after: { hoursSinceSent: Math.round(hoursSinceSent) },
  });
}

async function handleSecondReminder(
  payload: Awaited<ReturnType<typeof getPayload>>,
  assignment: LeadAssignment,
  ts: Date,
  competitorCountByLead: Map<number, number>,
): Promise<void> {
  const dealer =
    typeof assignment.dealer === "number" ? null : (assignment.dealer as Dealer | null);
  const lead = typeof assignment.lead === "number" ? null : (assignment.lead as LeadRequest | null);
  if (!dealer || !lead) return;

  const leadId = typeof assignment.lead === "number" ? assignment.lead : (lead.id as number);
  const sentAtMs = new Date(assignment.sent_at!).getTime();
  const hoursSinceSent = (ts.getTime() - sentAtMs) / HOUR_MS;
  const expiresInHours = Math.max(0, EXPIRE_HOURS - hoursSinceSent);
  const competitorCount = Math.max(0, (competitorCountByLead.get(leadId) ?? 1) - 1);

  await dispatch({
    key: "dealer-reminder-2",
    to: (dealer.email as string | undefined) ?? "",
    props: {
      dealerName: (dealer.legal_name as string | undefined) ?? "Partner",
      displayId: (lead.display_id as string | undefined) ?? `#${leadId}`,
      vehicle: vehicleLabel(lead),
      customerName: (lead.customer_name as string | undefined) ?? "",
      competitorCount,
      dashboardUrl: `${siteUrl()}/partneri/lead/${leadId}`,
      hoursSinceSent,
      expiresInHours,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    reminders: {
      ...(assignment.reminders ?? {}),
      // If we somehow skipped the 24h tick (e.g. cron paused), backfill
      // first_reminder_sent_at so the count is internally consistent.
      first_reminder_sent_at: assignment.reminders?.first_reminder_sent_at ?? ts.toISOString(),
      second_reminder_sent_at: ts.toISOString(),
    },
  };
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    data: patch,
  });

  // Spec: "Notifikaciju adminu (subtle)". For MVP an audit row suffices —
  // Sprint 7 polish wires a dedicated admin-side ticker / digest email.
  await logAudit({
    actorType: "system",
    action: "lead_assignment.reminder_2_sent",
    entityType: "lead_assignment",
    entityId: assignment.id,
    after: { hoursSinceSent: Math.round(hoursSinceSent), admin_notified: true },
  });
}

async function handleExpire(
  payload: Awaited<ReturnType<typeof getPayload>>,
  assignment: LeadAssignment,
  ts: Date,
): Promise<void> {
  const dealer =
    typeof assignment.dealer === "number" ? null : (assignment.dealer as Dealer | null);
  const dealerId =
    typeof assignment.dealer === "number" ? assignment.dealer : ((dealer?.id as number) ?? null);
  const sentAtMs = new Date(assignment.sent_at!).getTime();
  const hoursSinceSent = (ts.getTime() - sentAtMs) / HOUR_MS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    reminders: {
      ...(assignment.reminders ?? {}),
      expired_no_response: true,
      first_reminder_sent_at: assignment.reminders?.first_reminder_sent_at ?? ts.toISOString(),
      second_reminder_sent_at: assignment.reminders?.second_reminder_sent_at ?? ts.toISOString(),
    },
  };
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    data: patch,
  });

  // Score degradation: lift the dealer's avg_response_time_hours so they
  // rank lower in the next dispatch suggestion. We don't override down —
  // a slower-than-72h dealer should *stay* at least 72h regardless of any
  // prior fast leads, because the new evidence is what matters most.
  if (dealer && dealerId !== null) {
    const currentAvg = dealer.scoring?.avg_response_time_hours ?? 0;
    if (currentAvg < EXPIRE_HOURS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dealerPatch: any = {
        scoring: {
          ...(dealer.scoring ?? {}),
          avg_response_time_hours: EXPIRE_HOURS,
        },
      };
      await payload.update({
        collection: "dealers",
        id: dealerId,
        overrideAccess: true,
        data: dealerPatch,
      });
    }
  }

  await logAudit({
    actorType: "system",
    action: "lead_assignment.expired_no_response",
    entityType: "lead_assignment",
    entityId: assignment.id,
    after: { hoursSinceSent: Math.round(hoursSinceSent), dealer_id: dealerId },
  });
}

function vehicleLabel(lead: LeadRequest): string {
  const brand =
    lead.brand && typeof lead.brand !== "number" ? ((lead.brand as Brand).name ?? null) : null;
  const model =
    lead.model && typeof lead.model !== "number" ? ((lead.model as Model).name ?? null) : null;
  return [brand, model].filter(Boolean).join(" ") || "novo vozilo";
}
