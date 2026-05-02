import { pgTable, serial, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    endpoint: text("endpoint").notNull(),
    count: integer("count").notNull().default(0),
    windowStartAt: timestamp("window_start_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    keyEndpointIdx: uniqueIndex("rate_limit_buckets_key_endpoint_idx").on(
      table.key,
      table.endpoint,
    ),
    expiresAtIdx: index("rate_limit_buckets_expires_idx").on(table.expiresAt),
  }),
);

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert;
