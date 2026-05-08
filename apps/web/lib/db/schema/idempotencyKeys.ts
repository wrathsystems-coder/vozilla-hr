import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Idempotency cache for write endpoints. Client supplies an `Idempotency-Key`
// header (UUID); server stores the response so a replay (e.g. double-click,
// retry on flaky network) returns the original response instead of re-running
// the side effects (lead create, email dispatch).
//
// Separate from rate_limit_buckets: rate-limit is "should this request even
// run", idempotency is "have I seen this exact request before, what was the
// response". Distinct retention (60s vs 15min), distinct semantics, distinct
// audit trail — keeping them apart pays off for debugging and per-table
// cleanup cron in Sprint 5.

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    endpoint: text("endpoint").notNull(),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    keyEndpointIdx: uniqueIndex("idempotency_keys_key_endpoint_idx").on(table.key, table.endpoint),
    expiresAtIdx: index("idempotency_keys_expires_idx").on(table.expiresAt),
  }),
);

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert;
