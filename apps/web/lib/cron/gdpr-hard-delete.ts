import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { getDb } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Hard-delete the row for any lead that's been soft-cancelled (status='closed'
// via lib/leads/cancel-lead.ts) more than 30 days ago. The lead.cancel audit
// row is our source of truth for "when did the soft-delete happen" — Payload
// doesn't carry a separate `closed_at` on lead_requests, and updatedAt rotates
// on any subsequent edit (e.g. an admin touching internal_notes).
//
// We also cascade lead_assignments deletion. Magic-link tokens for the lead
// were already revoked at soft-delete time; cleanup-expired removes the rows.

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type HardDeleteResult = {
  candidates: number;
  leadsDeleted: number;
  assignmentsDeleted: number;
  errors: string[];
};

export async function runGdprHardDelete(): Promise<HardDeleteResult> {
  const cutoff = new Date(now().getTime() - RETENTION_DAYS * DAY_MS);

  // Find all lead.cancel audit rows older than the cutoff. The entity_id
  // is the lead_request id (stored as text in audit_log). One per lead;
  // a re-cancel would have failed on the existing closed status.
  const db = getDb();
  const rows = await db
    .select({ entityId: auditLog.entityId })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "lead.cancel"),
        eq(auditLog.entityType, "lead_request"),
        lt(auditLog.timestamp, cutoff),
      ),
    )
    .limit(500);

  const result: HardDeleteResult = {
    candidates: rows.length,
    leadsDeleted: 0,
    assignmentsDeleted: 0,
    errors: [],
  };

  if (rows.length === 0) return result;

  const payload = await getPayload({ config });

  for (const row of rows) {
    if (!row.entityId) continue;
    const leadId = Number(row.entityId);
    if (!Number.isInteger(leadId) || leadId <= 0) continue;

    // Confirm the lead actually exists and is still in the cancelled
    // state — defensive check in case the audit row outlived the lead
    // (a previous cron run already cleaned it up; we skip silently).
    let existing;
    try {
      existing = await payload.findByID({
        collection: "lead_requests",
        id: leadId,
        depth: 0,
      });
    } catch {
      continue;
    }
    if (!existing) continue;
    if (existing.status !== "closed") continue;

    try {
      // Delete dependent lead_assignments first (no FK cascade in Payload).
      const assignments = await payload.find({
        collection: "lead_assignments",
        where: { lead: { equals: leadId } },
        limit: 200,
        depth: 0,
      });
      for (const a of assignments.docs) {
        try {
          await payload.delete({
            collection: "lead_assignments",
            id: a.id,
            overrideAccess: true,
          });
          result.assignmentsDeleted += 1;
        } catch (err) {
          result.errors.push(
            `assignment_${a.id}_${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      await payload.delete({
        collection: "lead_requests",
        id: leadId,
        overrideAccess: true,
      });
      result.leadsDeleted += 1;

      await logAudit({
        actorType: "system",
        action: "lead.hard_delete",
        entityType: "lead_request",
        entityId: leadId,
        after: { retention_days: RETENTION_DAYS },
      });
    } catch (err) {
      result.errors.push(`lead_${leadId}_${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
