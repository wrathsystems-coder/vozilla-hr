import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";

export async function seedBodyTypes(payload: Payload) {
  console.log("  → reading seeds/body-types.json");
  const filePath = path.resolve(process.cwd(), "../../seeds/body-types.json");
  const data = JSON.parse(await readFile(filePath, "utf-8")) as Array<{
    slug: string;
    name: string;
    icon_svg_path?: string;
    sort_order: number;
  }>;
  console.log(`  → loaded ${data.length} rows`);

  let created = 0;
  let updated = 0;

  for (const row of data) {
    console.log(`  → ${row.slug}: searching`);
    const existing = await payload.find({
      collection: "body_types",
      where: { slug: { equals: row.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(`  → ${row.slug}: updating id=${existing.docs[0].id}`);
      await payload.update({
        collection: "body_types",
        id: existing.docs[0].id,
        data: row,
      });
      updated++;
    } else {
      console.log(`  → ${row.slug}: creating`);
      await payload.create({ collection: "body_types", data: row });
      created++;
    }
  }
  console.log(`  ✓ body_types: ${created} created, ${updated} updated`);
}
