import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { magicLinkTokens, type MagicLinkToken } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Schema-mirror — keep in sync with magicLinkPurposeEnum in
// lib/db/schema/magicLinkTokens.ts. Spec: docs/spec/05-data-and-systems.md
// "magic_link_tokens".
export type MagicLinkPurpose = "lead_tracker" | "password_reset" | "quiz_save" | "draft_resume";

const HOUR_MS = 60 * 60 * 1000;

/**
 * 64-char hex token (256 bits of entropy from crypto.randomBytes). Way past
 * the 32-char minimum the spec asks for; cheap to store, infeasible to
 * guess. Stored verbatim in the URL: /upit/{token}/.
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export type IssueArgs = {
  purpose: MagicLinkPurpose;
  entityType: string;
  entityId: string | number;
  ttlHours: number;
};

export type IssueResult = {
  token: string;
  expiresAt: Date;
};

export async function issueToken(args: IssueArgs): Promise<IssueResult> {
  if (args.ttlHours <= 0) {
    throw new Error(`issueToken: ttlHours must be > 0 (got ${args.ttlHours})`);
  }
  const db = getDb();
  const token = generateToken();
  const expiresAt = new Date(now().getTime() + args.ttlHours * HOUR_MS);

  await db.insert(magicLinkTokens).values({
    token,
    purpose: args.purpose,
    relatedEntityType: args.entityType,
    relatedEntityId: String(args.entityId),
    expiresAt,
  });

  return { token, expiresAt };
}

type ValidateOk = {
  valid: true;
  entityType: string;
  entityId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

type ValidateFail = {
  valid: false;
  reason: "not_found" | "expired" | "wrong_purpose";
};

export type ValidateResult = ValidateOk | ValidateFail;

/**
 * Validates a token but does NOT mark it used — multi-use flows like the
 * `/upit/{token}/` tracker can call this every page load. For single-use
 * flows (password reset) call `consumeToken` instead, which atomically
 * marks-used and rejects replay attempts.
 */
export async function validateToken(
  token: string,
  expectedPurpose: MagicLinkPurpose,
): Promise<ValidateResult> {
  const row = await fetchByToken(token);
  if (!row) return { valid: false, reason: "not_found" };
  if (row.purpose !== expectedPurpose) return { valid: false, reason: "wrong_purpose" };
  if (row.expiresAt.getTime() < now().getTime()) return { valid: false, reason: "expired" };
  return {
    valid: true,
    entityType: row.relatedEntityType ?? "",
    entityId: row.relatedEntityId ?? "",
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
  };
}

export async function markUsed(token: string): Promise<void> {
  const db = getDb();
  await db
    .update(magicLinkTokens)
    .set({ usedAt: now() })
    .where(and(eq(magicLinkTokens.token, token), isNull(magicLinkTokens.usedAt)));
}

type ConsumeOk = {
  valid: true;
  entityType: string;
  entityId: string;
  usedAt: Date;
};

type ConsumeFail = {
  valid: false;
  reason: "not_found" | "expired" | "wrong_purpose" | "already_used";
};

export type ConsumeResult = ConsumeOk | ConsumeFail;

/**
 * Atomic validate-and-mark-used. Use for single-use tokens (password reset,
 * one-shot magic logins). Two concurrent calls with the same token will see
 * exactly one succeed; the loser gets `already_used`.
 */
export async function consumeToken(
  token: string,
  expectedPurpose: MagicLinkPurpose,
): Promise<ConsumeResult> {
  const db = getDb();
  const usedAt = now();

  // Single UPDATE that only fires for fresh, on-purpose, unexpired rows.
  // Drizzle's pg-core returning() gives us the row if one was updated.
  const updated = await db
    .update(magicLinkTokens)
    .set({ usedAt })
    .where(
      and(
        eq(magicLinkTokens.token, token),
        eq(magicLinkTokens.purpose, expectedPurpose),
        isNull(magicLinkTokens.usedAt),
        // expiresAt > now() — Drizzle has gt(), but using JS-side compare in
        // a follow-up branch keeps the SQL simpler and the reason mapping
        // explicit. We re-fetch when UPDATE returns 0 to disambiguate.
      ),
    )
    .returning();

  if (updated.length === 1) {
    const row = updated[0];
    // We didn't filter on expiresAt in SQL, so an expired token would have
    // been "consumed" — undo and report expired.
    if (row.expiresAt.getTime() < usedAt.getTime()) {
      await db.update(magicLinkTokens).set({ usedAt: null }).where(eq(magicLinkTokens.id, row.id));
      return { valid: false, reason: "expired" };
    }
    return {
      valid: true,
      entityType: row.relatedEntityType ?? "",
      entityId: row.relatedEntityId ?? "",
      usedAt,
    };
  }

  // UPDATE matched zero rows — figure out why.
  const existing = await fetchByToken(token);
  if (!existing) return { valid: false, reason: "not_found" };
  if (existing.purpose !== expectedPurpose) return { valid: false, reason: "wrong_purpose" };
  if (existing.usedAt) return { valid: false, reason: "already_used" };
  // Shouldn't be reachable: row exists, right purpose, not used, but UPDATE
  // matched 0. Race condition or DB skew — surface loudly.
  throw new Error(
    `consumeToken: invariant violated — UPDATE returned 0 rows but token row matches all conditions (token starts with ${token.slice(0, 8)}…)`,
  );
}

/**
 * Mass-revoke for GDPR erasure / customer-cancels-request: marks every
 * still-fresh token tied to (entityType, entityId) as used. Returns count.
 */
export async function revokeTokensFor(
  entityType: string,
  entityId: string | number,
): Promise<number> {
  const db = getDb();
  const result = await db
    .update(magicLinkTokens)
    .set({ usedAt: now() })
    .where(
      and(
        eq(magicLinkTokens.relatedEntityType, entityType),
        eq(magicLinkTokens.relatedEntityId, String(entityId)),
        isNull(magicLinkTokens.usedAt),
      ),
    )
    .returning({ id: magicLinkTokens.id });
  return result.length;
}

async function fetchByToken(token: string): Promise<MagicLinkToken | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(magicLinkTokens)
    .where(eq(magicLinkTokens.token, token))
    .limit(1);
  return row;
}
