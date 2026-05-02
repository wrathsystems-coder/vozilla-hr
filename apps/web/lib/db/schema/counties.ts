import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const counties = pgTable("counties", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type County = typeof counties.$inferSelect;
export type NewCounty = typeof counties.$inferInsert;
