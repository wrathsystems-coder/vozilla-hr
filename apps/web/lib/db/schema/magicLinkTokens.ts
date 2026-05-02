import { pgTable, serial, text, timestamp, index, pgEnum } from "drizzle-orm/pg-core";

export const magicLinkPurposeEnum = pgEnum("magic_link_purpose", [
  "lead_tracker",
  "password_reset",
  "quiz_save",
  "draft_resume",
]);

export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    purpose: magicLinkPurposeEnum("purpose").notNull(),
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: text("related_entity_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    expiresAtIdx: index("magic_link_tokens_expires_idx").on(table.expiresAt),
    purposeIdx: index("magic_link_tokens_purpose_idx").on(table.purpose),
  }),
);

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert;
