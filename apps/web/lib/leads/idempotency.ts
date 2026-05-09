import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { idempotencyKeys } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Replay-safe handler cache. Caller passes an Idempotency-Key header
// (UUID generated client-side); within TTL the same (key, endpoint)
// returns the original response_body+status verbatim. No header → no
// caching, request runs.
//
// Sprint 5 cron uses the expires_at index to drop stale rows.

const DEFAULT_TTL_SEC = 60;

export type CachedResponse = {
  status: number;
  body: unknown;
};

export async function lookupIdempotent(
  key: string,
  endpoint: string,
): Promise<CachedResponse | null> {
  const [row] = await getDb()
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.endpoint, endpoint),
        gt(idempotencyKeys.expiresAt, now()),
      ),
    )
    .limit(1);
  if (!row) return null;
  return { status: row.responseStatus, body: row.responseBody };
}

export async function storeIdempotent(args: {
  key: string;
  endpoint: string;
  status: number;
  body: unknown;
  ttlSec?: number;
}): Promise<void> {
  const ttl = args.ttlSec ?? DEFAULT_TTL_SEC;
  const expiresAt = new Date(now().getTime() + ttl * 1000);
  await getDb()
    .insert(idempotencyKeys)
    .values({
      key: args.key,
      endpoint: args.endpoint,
      responseStatus: args.status,
      // Drizzle jsonb column accepts any JSON-serializable value.
      responseBody: args.body as never,
      expiresAt,
    })
    // Allow overwrite on conflict — previous attempt may have errored
    // before we got a chance to cache. UPSERT keeps semantics simple.
    .onConflictDoUpdate({
      target: [idempotencyKeys.key, idempotencyKeys.endpoint],
      set: {
        responseStatus: args.status,
        responseBody: args.body as never,
        expiresAt,
      },
    });
}
