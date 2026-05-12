import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import type { Dealer } from "@/payload-types";

// Runs at 00:05 on the 1st of each month (vercel.json). Zero out
// dealer.scoring.current_month_leads so the capacity score component in
// lib/lead-distribution rebases — without this, monthly_lead_cap would
// throttle every dealer to zero by Q2.

export type MonthlyResetResult = {
  dealersScanned: number;
  dealersReset: number;
  errors: string[];
};

export async function runMonthlyCounterReset(): Promise<MonthlyResetResult> {
  const payload = await getPayload({ config });
  const errors: string[] = [];

  // Scan in pages of 200 — a typical Croatian dealer network is in the
  // hundreds at most, but the loop scales if we grow.
  const PAGE = 200;
  let page = 1;
  let scanned = 0;
  let resetCount = 0;

  for (;;) {
    const result = await payload.find({
      collection: "dealers",
      limit: PAGE,
      page,
      depth: 0,
    });
    const docs = result.docs as Dealer[];
    if (docs.length === 0) break;

    for (const dealer of docs) {
      scanned += 1;
      const current = dealer.scoring?.current_month_leads ?? 0;
      if (current === 0) continue; // skip — already zero, no audit churn
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: any = {
          scoring: { ...(dealer.scoring ?? {}), current_month_leads: 0 },
        };
        await payload.update({
          collection: "dealers",
          id: dealer.id as number,
          overrideAccess: true,
          data: patch,
        });
        resetCount += 1;
      } catch (err) {
        errors.push(`dealer_${dealer.id}_${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (docs.length < PAGE) break;
    page += 1;
    if (page > 50) break; // safety net for runaway pagination
  }

  await logAudit({
    actorType: "system",
    action: "dealers.monthly_counter_reset",
    entityType: "dealers",
    entityId: null,
    after: { dealers_scanned: scanned, dealers_reset: resetCount, errors: errors.length },
  });

  return { dealersScanned: scanned, dealersReset: resetCount, errors };
}
