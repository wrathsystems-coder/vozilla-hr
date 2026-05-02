import { pgTable, serial, text, jsonb, timestamp, index, pgEnum } from "drizzle-orm/pg-core";

export const emailStatusEnum = pgEnum("email_status", ["pending", "sent", "failed", "bounced"]);

export const emailLog = pgTable(
  "email_log",
  {
    id: serial("id").primaryKey(),
    templateName: text("template_name").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    subject: text("subject").notNull(),
    payload: jsonb("payload"),
    status: emailStatusEnum("status").notNull().default("pending"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    recipientIdx: index("email_log_recipient_idx").on(table.recipientEmail),
    templateIdx: index("email_log_template_idx").on(table.templateName),
    statusIdx: index("email_log_status_idx").on(table.status),
  }),
);

export type EmailLogEntry = typeof emailLog.$inferSelect;
export type NewEmailLogEntry = typeof emailLog.$inferInsert;
