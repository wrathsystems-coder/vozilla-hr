import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "../../lib/db/client";
import { counties } from "../../lib/db/schema/counties";

export async function seedCounties() {
  console.log("  → reading seeds/counties-hr.json");
  const filePath = path.resolve(process.cwd(), "../../seeds/counties-hr.json");
  const data = JSON.parse(await readFile(filePath, "utf-8")) as Array<{
    slug: string;
    name: string;
    sort_order: number;
  }>;
  console.log(`  → loaded ${data.length} rows`);

  console.log("  → connecting to Postgres");
  const db = getDb();

  console.log("  → upserting rows");
  for (const row of data) {
    await db
      .insert(counties)
      .values({ slug: row.slug, name: row.name, sortOrder: row.sort_order })
      .onConflictDoUpdate({
        target: counties.slug,
        set: { name: row.name, sortOrder: row.sort_order },
      });
  }
  console.log(`  ✓ counties: ${data.length} rows seeded`);
}
