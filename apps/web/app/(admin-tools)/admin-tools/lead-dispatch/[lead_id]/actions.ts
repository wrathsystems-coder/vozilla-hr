"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin/auth";
import { dispatchToDealers } from "@/lib/leads/dispatch-to-dealers";
import { getClientIp } from "@/lib/http/client-ip";

export type DispatchActionResult = {
  ok: boolean;
  assignmentsCreated: number;
  assignmentsSkipped: number;
  emailsDispatched: number;
  errors: string[];
};

export async function dispatchLeadAction(
  leadId: number,
  selections: Array<{ dealerId: number; qualityScoreAtDispatch: number | null }>,
): Promise<DispatchActionResult> {
  const session = await requireAdmin(`/admin-tools/lead-dispatch/${leadId}`);
  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));

  const result = await dispatchToDealers({
    leadId,
    dealerSelections: selections,
    actorAdminId: String(session.user.id),
    ipAddress: ip,
  });

  // Refresh the page so the dispatched-state UI shows up.
  revalidatePath(`/admin-tools/lead-dispatch/${leadId}`);
  return result;
}
