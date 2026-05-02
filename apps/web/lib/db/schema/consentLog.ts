import { pgTable, serial, text, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";

export const consentTypeEnum = pgEnum("consent_type", [
  "oup",
  "marketing",
  "cookies_functional",
  "cookies_analytics",
  "cookies_marketing",
]);

export const consentLog = pgTable(
  "consent_log",
  {
    id: serial("id").primaryKey(),
    customerEmail: text("customer_email").notNull(),
    consentType: consentTypeEnum("consent_type").notNull(),
    granted: boolean("granted").notNull(),
    sourceForm: text("source_form").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("consent_log_email_idx").on(table.customerEmail),
    timestampIdx: index("consent_log_timestamp_idx").on(table.timestamp),
  }),
);

export type ConsentLogEntry = typeof consentLog.$inferSelect;
export type NewConsentLogEntry = typeof consentLog.$inferInsert;
