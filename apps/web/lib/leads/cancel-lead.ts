import "server-only";
import { createHash } from "node:crypto";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { revokeTokensFor } from "@/lib/magic-link";
import { now } from "@/lib/utils/time";

// Soft-delete spec: docs/spec/04-features-and-flows.md "Pravo na zaborav".
// Anonymise PII, revoke active magic links, close every dealer assignment.
// Hard-delete after 30-day retention is a Sprint 5 cron job.

export type CancelOutcome =
  | { ok: true; assignmentsClosed: number; tokensRevoked: number }
  | { ok: false; reason: "not_found" | "already_cancelled" };

const ANON_DOMAIN = "@vozilla.invalid";

function anonymisedEmail(originalEmail: string): string {
  const hash = createHash("sha256").update(originalEmail).digest("hex").slice(0, 16);
  return `deleted-${hash}${ANON_DOMAIN}`;
}

export async function cancelLead(args: {
  leadId: number;
  reason: "customer_cancelled" | "gdpr_erasure";
  ipAddress?: string | null;
}): Promise<CancelOutcome> {
  const payload = await getPayload({ config });

  let existing;
  try {
    existing = await payload.findByID({
      collection: "lead_requests",
      id: args.leadId,
      depth: 0,
    });
  } catch {
    return { ok: false, reason: "not_found" };
  }
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status === "closed") return { ok: false, reason: "already_cancelled" };

  const previousEmail = (existing.customer_email as string | undefined) ?? "";

  // 1. Anonymise PII on the lead row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anonData: any = {
    customer_name: "Izbrisano",
    customer_email: anonymisedEmail(previousEmail || `lead-${args.leadId}`),
    // Placeholder satisfies Payload's required check + the HR phone regex
    // without leaking the original number. Sprint 5 hard-delete cron drops
    // the row entirely after the 30-day retention window.
    customer_phone: "+385000000000",
    internal_notes:
      `${existing.internal_notes ?? ""}\n[${now().toISOString()}] cancelled (${args.reason})`.trim(),
    status: "closed",
  };
  await payload.update({
    collection: "lead_requests",
    id: args.leadId,
    overrideAccess: true,
    data: anonData,
  });

  // 2. Close any open dealer assignments (no further dealer outreach).
  const assignments = await payload.find({
    collection: "lead_assignments",
    where: { lead: { equals: args.leadId } },
    limit: 200,
    depth: 0,
  });
  let assignmentsClosed = 0;
  for (const a of assignments.docs) {
    if (a.status !== "closed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const closeData: any = {
        status: "closed",
        closed_at: now().toISOString(),
        outcome: "other",
        outcome_reason: `Customer cancelled (${args.reason})`,
      };
      await payload.update({
        collection: "lead_assignments",
        id: a.id,
        overrideAccess: true,
        data: closeData,
      });
      assignmentsClosed++;
    }
  }

  // 3. Revoke any still-fresh tracker / draft tokens for this lead.
  const tokensRevoked = await revokeTokensFor("lead_request", args.leadId);

  // 4. Audit trail (anonymises previous_email — only the hash leaks).
  await logAudit({
    actorType: "customer",
    action: "lead.cancel",
    entityType: "lead_request",
    entityId: args.leadId,
    before: {
      status: existing.status,
      email_hash: createHash("sha256").update(previousEmail).digest("hex").slice(0, 16),
    },
    after: { status: "closed", reason: args.reason },
    ipAddress: args.ipAddress ?? null,
  });

  return { ok: true, assignmentsClosed, tokensRevoked };
}
