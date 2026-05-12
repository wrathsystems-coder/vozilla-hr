"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { requireDealer } from "@/lib/dealer/auth";
import { getClientIp } from "@/lib/http/client-ip";
import { now } from "@/lib/utils/time";
import type { Dealer, LeadAssignment } from "@/payload-types";

// Status-mutation server actions for /dileri/lead/[id]. All actions:
//   - re-resolve the dealer session (defence in depth — never trust the
//     incoming form payload to identify the actor)
//   - look up the (lead, dealer) assignment by composite filter — refuses
//     if there's no row, even if the dealer crafts a leadId they aren't
//     assigned to
//   - write status + timestamp + audit log
//   - never lower the state (e.g. closing a contacted lead is fine, but
//     a closed lead cannot be "re-viewed")

const STATUS_ORDER: Record<LeadAssignment["status"], number> = {
  sent: 0,
  viewed: 1,
  contacted: 2,
  closed: 3,
};

type ActionResult = { ok: true } | { ok: false; message: string };

async function loadOwnAssignment(leadId: number, dealerId: number): Promise<LeadAssignment | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: leadId }, dealer: { equals: dealerId } },
    limit: 1,
    depth: 0,
  });
  const [row] = result.docs as LeadAssignment[];
  return row ?? null;
}

async function ipFromHeaders(): Promise<string> {
  const headerList = await headers();
  return getClientIp(new Request("http://x", { headers: headerList }));
}

export async function markViewed(leadId: number): Promise<ActionResult> {
  const { dealer } = await requireDealer(`/dileri/lead/${leadId}`);
  const assignment = await loadOwnAssignment(leadId, dealer.id as number);
  if (!assignment) return { ok: false, message: "Lead nije pronađen." };

  // Already past 'viewed' — no-op rather than regressing the state.
  if (STATUS_ORDER[assignment.status] >= STATUS_ORDER.viewed) return { ok: true };

  const payload = await getPayload({ config });
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: "viewed", viewed_at: now().toISOString() } as any,
  });
  await logAudit({
    actorType: "dealer",
    actorId: String(dealer.id),
    action: "lead_assignment.mark_viewed",
    entityType: "lead_assignment",
    entityId: assignment.id,
    before: { status: assignment.status },
    after: { status: "viewed" },
    ipAddress: await ipFromHeaders(),
  });
  revalidatePath(`/dileri/lead/${leadId}`);
  return { ok: true };
}

export async function markContacted(leadId: number): Promise<ActionResult> {
  const { dealer } = await requireDealer(`/dileri/lead/${leadId}`);
  const assignment = await loadOwnAssignment(leadId, dealer.id as number);
  if (!assignment) return { ok: false, message: "Lead nije pronađen." };
  if (assignment.status === "closed") return { ok: false, message: "Lead je već zatvoren." };

  const payload = await getPayload({ config });
  const ts = now().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = { status: "contacted", contacted_at: ts };
  if (!assignment.viewed_at) patch.viewed_at = ts;
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    data: patch,
  });
  await logAudit({
    actorType: "dealer",
    actorId: String(dealer.id),
    action: "lead_assignment.mark_contacted",
    entityType: "lead_assignment",
    entityId: assignment.id,
    before: { status: assignment.status },
    after: { status: "contacted" },
    ipAddress: await ipFromHeaders(),
  });
  revalidatePath(`/dileri/lead/${leadId}`);
  return { ok: true };
}

export type CloseInput = {
  leadId: number;
  outcome: NonNullable<LeadAssignment["outcome"]>;
  outcomeReason: string;
};

export async function closeLead(input: CloseInput): Promise<ActionResult> {
  const { dealer } = await requireDealer(`/dileri/lead/${input.leadId}`);
  if (!input.outcome) return { ok: false, message: "Odaberi ishod." };

  const assignment = await loadOwnAssignment(input.leadId, dealer.id as number);
  if (!assignment) return { ok: false, message: "Lead nije pronađen." };
  if (assignment.status === "closed") return { ok: false, message: "Lead je već zatvoren." };

  const payload = await getPayload({ config });
  const ts = now().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    status: "closed",
    closed_at: ts,
    outcome: input.outcome,
    outcome_reason: input.outcomeReason.slice(0, 2000),
  };
  if (!assignment.viewed_at) patch.viewed_at = ts;
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    data: patch,
  });
  await logAudit({
    actorType: "dealer",
    actorId: String(dealer.id),
    action: "lead_assignment.close",
    entityType: "lead_assignment",
    entityId: assignment.id,
    before: { status: assignment.status },
    after: { status: "closed", outcome: input.outcome },
    ipAddress: await ipFromHeaders(),
  });
  revalidatePath(`/dileri/lead/${input.leadId}`);
  return { ok: true };
}

export async function saveNotes(leadId: number, notes: string): Promise<ActionResult> {
  const { dealer } = await requireDealer(`/dileri/lead/${leadId}`);
  const assignment = await loadOwnAssignment(leadId, dealer.id as number);
  if (!assignment) return { ok: false, message: "Lead nije pronađen." };

  const payload = await getPayload({ config });
  await payload.update({
    collection: "lead_assignments",
    id: assignment.id as number,
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { dealer_notes: notes.slice(0, 5000) } as any,
  });
  await logAudit({
    actorType: "dealer",
    actorId: String((dealer as Dealer).id),
    action: "lead_assignment.save_notes",
    entityType: "lead_assignment",
    entityId: assignment.id,
    ipAddress: await ipFromHeaders(),
  });
  revalidatePath(`/dileri/lead/${leadId}`);
  return { ok: true };
}
