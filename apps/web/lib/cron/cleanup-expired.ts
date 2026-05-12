import "server-only";
import { lt } from "drizzle-orm";
import { logAudit } from "@/lib/audit-log";
import { getDb } from "@/lib/db/client";
import { idempotencyKeys, magicLinkTokens, rateLimitBuckets } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Daily cleanup of expired auxiliary rows. None of these are user-facing
// records — keeping them indefinitely is pure cost.
//
// - magic_link_tokens: expires_at < now (single-use semantics handled
//   separately via consumeToken; we still keep expired-but-unused rows
//   around until cleanup so audit + replay diagnostics can run within a
//   day's window).
// - rate_limit_buckets: expires_at < now (fixed-window resets at expiry;
//   stale rows are harmless but pile up).
// - idempotency_keys: expires_at < now (idempotency window has lapsed,
//   client can retry under a new key).

export type CleanupResult = {
  magicLinkTokensDeleted: number;
  rateLimitBucketsDeleted: number;
  idempotencyKeysDeleted: number;
};

export async function runCleanupExpired(): Promise<CleanupResult> {
  const db = getDb();
  const ts = now();

  const tokens = await db
    .delete(magicLinkTokens)
    .where(lt(magicLinkTokens.expiresAt, ts))
    .returning({ id: magicLinkTokens.id });

  const buckets = await db
    .delete(rateLimitBuckets)
    .where(lt(rateLimitBuckets.expiresAt, ts))
    .returning({ id: rateLimitBuckets.id });

  const idem = await db
    .delete(idempotencyKeys)
    .where(lt(idempotencyKeys.expiresAt, ts))
    .returning({ id: idempotencyKeys.id });

  const result: CleanupResult = {
    magicLinkTokensDeleted: tokens.length,
    rateLimitBucketsDeleted: buckets.length,
    idempotencyKeysDeleted: idem.length,
  };

  if (
    result.magicLinkTokensDeleted + result.rateLimitBucketsDeleted + result.idempotencyKeysDeleted >
    0
  ) {
    await logAudit({
      actorType: "system",
      action: "cleanup.expired_rows",
      after: result as unknown as Record<string, unknown>,
    });
  }

  return result;
}
