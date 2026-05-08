import { lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Fixed-window counter (NOT true sliding window). For our threat model —
// stop a single bot/abuser from spamming public POST endpoints, not block
// a coordinated DDoS — fixed-window is plenty: at the window boundary a
// caller can send up to 2*limit in 2 ms (last N + first N), but they
// then have to wait the full window before another N. Spec calls for
// "rate limit po IP-u + emailu" which fits this. True sliding-window
// (Redis ZADD with timestamp scores) lands when we provision Upstash —
// placeholder env already in .env.example.

export type EnforceArgs = {
  /** Composite key like "ip:1.2.3.4", "email:foo@example.com", or "ip:1.2.3.4|email:foo@…". */
  key: string;
  /** Logical endpoint identifier — same key + different endpoints have independent counters. */
  endpoint: string;
  /** Maximum requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
};

export type EnforceResult = {
  allowed: boolean;
  /** Requests left in the current window. 0 once blocked. */
  remaining: number;
  /** Seconds until the window resets. 0 when allowed. */
  retryAfterSec: number;
  /** When the current window expires. */
  resetAt: Date;
};

export async function enforce(args: EnforceArgs): Promise<EnforceResult> {
  if (args.limit <= 0) throw new Error(`enforce: limit must be > 0 (got ${args.limit})`);
  if (args.windowSec <= 0)
    throw new Error(`enforce: windowSec must be > 0 (got ${args.windowSec})`);

  const db = getDb();
  const nowDate = now();
  const newExpiresAt = new Date(nowDate.getTime() + args.windowSec * 1000);
  // postgres-js doesn't bind Date objects in raw sql`` templates — convert
  // to ISO strings and let Postgres coerce them to timestamptz at parse time.
  const nowIso = nowDate.toISOString();
  const newExpiresIso = newExpiresAt.toISOString();

  // Atomic upsert: insert new bucket, or — on conflict — either reset
  // (window expired) or increment. CASE WHEN inside the SET clause runs
  // server-side so two concurrent requests never observe a stale count.
  const [row] = await db
    .insert(rateLimitBuckets)
    .values({
      key: args.key,
      endpoint: args.endpoint,
      count: 1,
      windowStartAt: nowDate,
      expiresAt: newExpiresAt,
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.endpoint],
      set: {
        count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} < ${nowIso}::timestamptz THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStartAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} < ${nowIso}::timestamptz THEN ${nowIso}::timestamptz ELSE ${rateLimitBuckets.windowStartAt} END`,
        expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} < ${nowIso}::timestamptz THEN ${newExpiresIso}::timestamptz ELSE ${rateLimitBuckets.expiresAt} END`,
      },
    })
    .returning();

  const count = row.count;
  const resetAt = row.expiresAt;
  const allowed = count <= args.limit;

  return {
    allowed,
    remaining: allowed ? Math.max(0, args.limit - count) : 0,
    retryAfterSec: allowed
      ? 0
      : Math.max(1, Math.ceil((resetAt.getTime() - nowDate.getTime()) / 1000)),
    resetAt,
  };
}

/** Cron helper: drop rows with expires_at in the past. Returns number deleted. */
export async function cleanupExpired(): Promise<number> {
  const db = getDb();
  const result = await db
    .delete(rateLimitBuckets)
    .where(lt(rateLimitBuckets.expiresAt, now()))
    .returning({ id: rateLimitBuckets.id });
  return result.length;
}
