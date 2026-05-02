import { pgTable, serial, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const quizResults = pgTable(
  "quiz_results",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    answers: jsonb("answers").notNull(),
    recommendedModels: jsonb("recommended_models"),
    customerEmail: text("customer_email"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    expiresAtIdx: index("quiz_results_expires_idx").on(table.expiresAt),
  }),
);

export type QuizResult = typeof quizResults.$inferSelect;
export type NewQuizResult = typeof quizResults.$inferInsert;
