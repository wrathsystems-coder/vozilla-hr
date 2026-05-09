"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cancelLead } from "@/lib/leads/cancel-lead";
import { getClientIp } from "@/lib/http/client-ip";
import { validateToken } from "@/lib/magic-link";

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
