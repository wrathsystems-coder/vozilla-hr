"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { logAudit } from "@/lib/audit-log";
import { cancelLead } from "@/lib/leads/cancel-lead";
import { getClientIp } from "@/lib/http/client-ip";
import { validateToken } from "@/lib/magic-link";
import { enforce as rateLimit } from "@/lib/rate-limit";
import { now } from "@/lib/utils/time";
import type { LeadAssignment } from "@/payload-types";

export async function cancelLeadAction(token: string): Promise<{ ok: boolean; error?: string }> {
  const validated = await validateToken(token, "lead_tracker");
  if (!validated.valid) {
    return { ok: false, error: validated.reason };
  }
  const leadId = Number(validated.entityId);
  if (!Number.isFinite(leadId)) {
    return { ok: false, error: "invalid_lead_id" };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(new Request("http://x", { headers: requestHeaders }));

  const outcome = await cancelLead({ leadId, reason: "customer_cancelled", ipAddress: ip });
  if (!outcome.ok) {
    return { ok: false, error: outcome.reason };
  }

  // Token has just been revoked, but we still want the page to re-render
  // so the customer sees the "cancelled" banner instead of the timeline.
  revalidatePath(`/upit/${token}`);
  return { ok: true };
}

async function resolveTrackerLeadId(token: string): Promise<{ leadId: number; ip: string } | null> {
  const validated = await validateToken(token, "lead_tracker");
  if (!validated.valid) return null;
  const leadId = Number(validated.entityId);
  if (!Number.isFinite(leadId) || leadId <= 0) return null;
  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));
  return { leadId, ip };
}

export async function markDealerInterestAction(
  token: string,
  assignmentId: number,
  interested: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await resolveTrackerLeadId(token);
  if (!ctx) return { ok: false, error: "invalid_token" };

  // Rate-limit per-token so a stale link in someone's bookmarks can't be
  // hammered to flip flags repeatedly. 30 marks per hour is plenty for a
  // real customer adjusting their mind across 3-5 dealers.
  const rate = await rateLimit({
    key: `token:${token.slice(0, 16)}`,
    endpoint: "tracker-mark-interest",
    limit: 30,
    windowSec: 60 * 60,
  });
  if (!rate.allowed) return { ok: false, error: "rate_limited" };

  const payload = await getPayload({ config });
  let assignment: LeadAssignment;
  try {
    assignment = (await payload.findByID({
      collection: "lead_assignments",
      id: assignmentId,
      depth: 0,
    })) as LeadAssignment;
  } catch {
    return { ok: false, error: "not_found" };
  }
  // The assignment must belong to the lead this token tracks.
  const assignmentLeadId =
    typeof assignment.lead === "number" ? assignment.lead : (assignment.lead?.id as number);
  if (assignmentLeadId !== ctx.leadId) return { ok: false, error: "not_found" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    customer_feedback: {
      ...(assignment.customer_feedback ?? {}),
      marked_interested: interested,
      marked_not_interested: !interested,
    },
  };
  await payload.update({
    collection: "lead_assignments",
    id: assignmentId,
    overrideAccess: true,
    data: patch,
  });

  await logAudit({
    actorType: "customer",
    action: interested
      ? "lead_assignment.marked_interested"
      : "lead_assignment.marked_not_interested",
    entityType: "lead_assignment",
    entityId: assignmentId,
    ipAddress: ctx.ip,
  });

  revalidatePath(`/upit/${token}`);
  return { ok: true };
}

const boughtSchema = z.object({
  where: z.enum(["vozilla", "elsewhere"]),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export async function markBoughtAction(
  token: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await resolveTrackerLeadId(token);
  if (!ctx) return { ok: false, error: "invalid_token" };

  const parsed = boughtSchema.safeParse({
    where: String(formData.get("where") ?? ""),
    brand: String(formData.get("brand") ?? "").trim() || undefined,
    model: String(formData.get("model") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  // Rate-limit: this is a one-time action per lead, but a confused user
  // double-clicking shouldn't burn through a global IP budget.
  const rate = await rateLimit({
    key: `token:${token.slice(0, 16)}`,
    endpoint: "tracker-mark-bought",
    limit: 5,
    windowSec: 60 * 60,
  });
  if (!rate.allowed) return { ok: false, error: "rate_limited" };

  const payload = await getPayload({ config });

  // Close all open dealer assignments so the cron stops chasing.
  const assignments = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: ctx.leadId } },
    limit: 200,
    depth: 0,
  });
  const ts = now().toISOString();
  for (const a of assignments.docs as LeadAssignment[]) {
    if (a.status === "closed") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const closeData: any = {
      status: "closed",
      closed_at: ts,
      outcome: parsed.data.where === "vozilla" && a.contacted_at ? "sold" : "customer_unresponsive",
      outcome_reason: `Kupac je označio: kupljeno preko ${
        parsed.data.where === "vozilla" ? "vozilla.hr dilera" : "drugog izvora"
      }${parsed.data.brand || parsed.data.model ? ` (${[parsed.data.brand, parsed.data.model].filter(Boolean).join(" ")})` : ""}.`,
    };
    await payload.update({
      collection: "lead_assignments",
      id: a.id,
      overrideAccess: true,
      data: closeData,
    });
  }

  // Annotate lead with what the customer reported. We do NOT anonymise —
  // this is a conversion event, not a GDPR erasure. The audit row holds
  // the structured detail for admin dashboards.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadPatch: any = {
    status: "closed",
    internal_notes: [
      `[${ts}] customer reported purchase`,
      `where=${parsed.data.where}`,
      parsed.data.brand ? `brand=${parsed.data.brand}` : null,
      parsed.data.model ? `model=${parsed.data.model}` : null,
      parsed.data.notes ? `notes=${parsed.data.notes}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
  await payload.update({
    collection: "lead_requests",
    id: ctx.leadId,
    overrideAccess: true,
    data: leadPatch,
  });

  await logAudit({
    actorType: "customer",
    action: "lead.customer_reported_purchase",
    entityType: "lead_request",
    entityId: ctx.leadId,
    after: {
      where: parsed.data.where,
      brand: parsed.data.brand ?? null,
      model: parsed.data.model ?? null,
    },
    ipAddress: ctx.ip,
  });

  revalidatePath(`/upit/${token}`);
  return { ok: true };
}
