import { getDb } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Mirrors actorTypeEnum in lib/db/schema/auditLog.ts. Spec:
// docs/spec/05-data-and-systems.md "audit_log" + section 02 "Logiranje".
// Every admin action that mutates state writes here; same for system
// actions (cron, post-create hooks).
export type ActorType = "admin" | "system" | "dealer" | "customer";

export type LogAuditArgs = {
  actorType: ActorType;
  /** Payload user id, dealer id, customer email — whatever uniquely identifies the actor. */
  actorId?: string | null;
  /** Dotted action name — e.g. "lead.create", "lead.send_to_dealers", "dealer.suspend". */
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  /** Pre-mutation snapshot for diffing in admin UI. JSON-serializable. */
  before?: unknown;
  /** Post-mutation snapshot. JSON-serializable. */
  after?: unknown;
  ipAddress?: string | null;
};

export async function logAudit(args: LogAuditArgs): Promise<void> {
  await getDb()
    .insert(auditLog)
    .values({
      actorType: args.actorType,
      actorId: args.actorId ?? null,
      action: args.action,
      entityType: args.entityType ?? null,
      entityId:
        args.entityId !== undefined && args.entityId !== null ? String(args.entityId) : null,
      before: (args.before as never) ?? null,
      after: (args.after as never) ?? null,
      ipAddress: args.ipAddress ?? null,
      timestamp: now(),
    });
}
